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

function istTargetStrings(offsetMinutes: number): { date: string; timeStart: string; timeEnd: string } {
  // 1. Calculate the exact target time in IST
  const baseTimeMs = Date.now() + (5 * 60 + 30) * 60_000 + offsetMinutes * 60_000;

  // 2. Remove the overlapping range. Simply look at the exact target minute up to 59 seconds.
  const d = new Date(baseTimeMs);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    timeStart: `${hh}:${mi}:00`,
    timeEnd: `${hh}:${mi}:59`,
  };
}

async function fetchWindow(
  supabase: ReturnType<typeof createClient>,
  offsetMinutes: number,
  flagCol: "notified_30m" | "notified_10m" | "notified_1m",
): Promise<EventRow[]> {
  const target = istTargetStrings(offsetMinutes);
  const { data, error } = await supabase
    .from("custom_events")
    .select("id, user_id, title, description, date, time")
    .eq("date", target.date)
    .gte("time", target.timeStart)
    .lte("time", target.timeEnd)
    .eq(flagCol, false);

  if (error) throw new Error(`fetch ${flagCol} failed: ${error.message}`);
  console.log(`[${flagCol}] Scanning exact target window: ${target.date} ${target.timeStart} to ${target.timeEnd}`);
  return (data ?? []) as EventRow[];
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
      flag: "notified_30m" | "notified_10m" | "notified_1m";
      offset: number;
      minutesLabel: number;
    }> = [
      { label: "30m", flag: "notified_30m", offset: 30, minutesLabel: 30 },
      { label: "10m", flag: "notified_10m", offset: 10, minutesLabel: 10 },
      { label: "1m", flag: "notified_1m", offset: 1, minutesLabel: 1 },
    ];

    const summary: Record<string, unknown> = {};

    for (const w of windows) {
      const events = await fetchWindow(supabase, w.offset, w.flag);
      let sent = 0;
      let failed = 0;
      const successIds: string[] = [];
      const failures: Array<Record<string, unknown>> = [];

      const settled = await processInChunks(events, CONCURRENCY, async (e) => {
        const isOneMin = w.label === "1m";
        const title = sanitize(
          isOneMin
            ? `🚨 Hurry! '${e.title}' starts in 1 minute!`
            : `⏰ Reminder: '${e.title}' starts in ${w.minutesLabel} minutes!`,
          120,
        );
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