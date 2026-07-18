import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APPILIX_TIMEOUT_MS = 10_000;
const CONCURRENCY = 20;

interface EventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  start_at: string; // ISO
}

function sanitize(text: string, max = 500): string {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

async function sendAppilix(
  appKey: string,
  apiKey: string,
  title: string,
  body: string,
  userIdentity: string,
): Promise<{ ok: boolean; status: number; response: string }> {
  const form = new URLSearchParams();
  form.set("app_key", appKey);
  form.set("api_key", apiKey);
  form.set("notification_title", title);
  form.set("notification_body", body);
  form.set("user_identity", userIdentity);

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), APPILIX_TIMEOUT_MS);
  try {
    const res = await fetch("https://appilix.com/api/push-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json",
      },
      body: form.toString(),
      signal: ctrl.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, response: text };
  } finally {
    clearTimeout(to);
  }
}

async function processInChunks<T, R>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += size) {
    const settled = await Promise.allSettled(items.slice(i, i + size).map(worker));
    out.push(...settled);
  }
  return out;
}

async function fetchWindow(
  supabase: ReturnType<typeof createClient>,
  minMinutes: number,
  maxMinutes: number,
  flagCol: "notified_30m" | "notified_10m",
): Promise<EventRow[]> {
  const now = new Date();
  const from = new Date(now.getTime() + minMinutes * 60_000).toISOString();
  const to = new Date(now.getTime() + maxMinutes * 60_000).toISOString();

  // Use a raw SQL RPC via `.rpc` isn't available; use PostgREST filter on computed via view isn't set up.
  // Instead fetch a candidate set by date/time using an inline SQL via `.from(...).select(...)` with computed filters is limited.
  // Simpler: use the `custom_events` table and filter with expression via `.filter` isn't possible for expressions.
  // We use the RPC-less approach: call an inline SQL query through the REST endpoint using `.rpc` requires a defined function.
  // Fallback: use the built-in `postgrest` with `date` bound to the day range in IST, then filter in JS.

  // Compute IST date bounds for coverage (yesterday..tomorrow to cover TZ edges).
  const nowIST = new Date(now.getTime() + 5.5 * 3600_000);
  const y = new Date(nowIST); y.setUTCDate(y.getUTCDate() - 1);
  const t = new Date(nowIST); t.setUTCDate(t.getUTCDate() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("custom_events")
    .select("id, user_id, title, description, date, time")
    .gte("date", iso(y))
    .lte("date", iso(t))
    .not("time", "is", null)
    .eq(flagCol, false);

  if (error) throw new Error(`fetch ${flagCol} failed: ${error.message}`);

  const rows = (data ?? []) as Array<Omit<EventRow, "start_at">>;
  const matched: EventRow[] = [];
  for (const r of rows) {
    if (!r.time) continue;
    // Interpret date+time as IST -> UTC
    const [hh, mm] = r.time.split(":").map(Number);
    const [yy, mo, dd] = r.date.split("-").map(Number);
    const istMs = Date.UTC(yy, mo - 1, dd, hh, mm, 0) - 5.5 * 3600_000;
    const startAt = new Date(istMs);
    if (startAt >= new Date(from) && startAt <= new Date(to)) {
      matched.push({ ...r, start_at: startAt.toISOString() });
    }
  }
  return matched;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appKey = Deno.env.get("APPILIX_APP_KEY");
    const apiKey = Deno.env.get("APPILIX_API_KEY");
    if (!appKey || !apiKey) {
      throw new Error("APPILIX_APP_KEY / APPILIX_API_KEY are not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const windows: Array<{
      label: string;
      flag: "notified_30m" | "notified_10m";
      min: number;
      max: number;
      minutesLabel: number;
    }> = [
      { label: "30m", flag: "notified_30m", min: 29, max: 31, minutesLabel: 30 },
      { label: "10m", flag: "notified_10m", min: 9, max: 11, minutesLabel: 10 },
    ];

    const summary: Record<string, unknown> = {};

    for (const w of windows) {
      const events = await fetchWindow(supabase, w.min, w.max, w.flag);
      let sent = 0;
      let failed = 0;
      const successIds: string[] = [];
      const failures: Array<Record<string, unknown>> = [];

      const settled = await processInChunks(events, CONCURRENCY, async (e) => {
        const title = sanitize(`⏰ Reminder: '${e.title}' starts in ${w.minutesLabel} minutes!`, 120);
        const body = sanitize(
          e.description
            ? `${e.description}`
            : `Your event '${e.title}' is starting soon.`,
          500,
        );
        const push = await sendAppilix(appKey, apiKey, title, body, e.user_id);
        if (!push.ok) {
          throw new Error(`Appilix ${push.status}: ${push.response.slice(0, 200)}`);
        }
        return e.id;
      });

      for (let i = 0; i < settled.length; i++) {
        const s = settled[i];
        if (s.status === "fulfilled") {
          sent++;
          successIds.push(s.value);
        } else {
          failed++;
          failures.push({ id: events[i].id, error: String(s.reason) });
        }
      }

      if (successIds.length > 0) {
        const { error: updErr } = await supabase
          .from("custom_events")
          .update({ [w.flag]: true, updated_at: new Date().toISOString() })
          .in("id", successIds);
        if (updErr) console.error(`bulk update ${w.flag} failed:`, updErr.message);
      }

      summary[w.label] = { candidates: events.length, sent, failed, failures: failures.slice(0, 10) };
    }

    return new Response(
      JSON.stringify({ ok: true, at: new Date().toISOString(), ...summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-calendar-reminders error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});