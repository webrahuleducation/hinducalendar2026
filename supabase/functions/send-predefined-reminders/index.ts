import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APPILIX_TIMEOUT_MS = 10_000;
const CONCURRENCY = 20;
const BATCH_LIMIT = 500;

type FlagCol = "notified_d2" | "notified_d1" | "notified_d0";

interface ReminderRow {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string | null;
  event_date: string;
}

function sanitize(text: string, max = 500): string {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Current wall-clock date/time in IST (UTC+5:30), derived without Date parsing pitfalls. */
function istNow(): { date: string; hour: number; minute: number } {
  const d = new Date(Date.now() + (5 * 60 + 30) * 60_000);
  return {
    date: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${
      String(d.getUTCDate()).padStart(2, "0")
    }`,
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${
    String(dt.getUTCDate()).padStart(2, "0")
  }`;
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

    const now = istNow();

    // Windows are evaluated against IST wall-clock time. Each row carries its own
    // "already sent" flag, so re-running the function is always idempotent.
    const windows: Array<{
      label: string;
      flag: FlagCol;
      offsetDays: number;
      fireHour: number;
      phrase: string;
      emoji: string;
    }> = [
      { label: "d2", flag: "notified_d2", offsetDays: 2, fireHour: 8, phrase: "day after tomorrow", emoji: "🗓️" },
      { label: "d1", flag: "notified_d1", offsetDays: 1, fireHour: 8, phrase: "tomorrow", emoji: "🔔" },
      { label: "d0", flag: "notified_d0", offsetDays: 0, fireHour: 6, phrase: "today", emoji: "🙏" },
    ];

    const summary: Record<string, unknown> = {
      ist: `${now.date} ${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`,
    };

    for (const w of windows) {
      if (now.hour < w.fireHour) {
        summary[w.label] = { skipped: `before ${w.fireHour}:00 IST` };
        continue;
      }

      const targetDate = addDays(now.date, w.offsetDays);
      const { data, error } = await supabase
        .from("event_reminders")
        .select("id, user_id, event_id, event_title, event_date")
        .eq("reminder_enabled", true)
        .eq("event_date", targetDate)
        .eq(w.flag, false)
        .limit(BATCH_LIMIT);

      if (error) throw new Error(`fetch ${w.flag} failed: ${error.message}`);
      const rows = (data ?? []) as ReminderRow[];
      console.log(`[${w.label}] target ${targetDate}: ${rows.length} candidates`);

      const successIds: string[] = [];
      const failures: Array<Record<string, unknown>> = [];

      const settled = await processInChunks(rows, CONCURRENCY, async (r) => {
        const name = r.event_title?.trim() || "A festival";
        const title = sanitize(
          w.label === "d0"
            ? `${w.emoji} Today: ${name}`
            : `${w.emoji} Reminder: ${name}`,
          120,
        );
        const body = sanitize(
          w.label === "d0"
            ? `${name} is today. Have a blessed day. 🕉️`
            : `Reminder: ${name} is ${w.phrase}.`,
          500,
        );
        const push = await sendAppilix(appKey, apiKey, title, body, r.user_id);
        if (!push.ok) {
          throw new Error(`Appilix ${push.status}: ${push.response.slice(0, 200)}`);
        }
        return r.id;
      });

      for (let i = 0; i < settled.length; i++) {
        const s = settled[i];
        if (s.status === "fulfilled") successIds.push(s.value);
        else failures.push({ id: rows[i].id, error: String(s.reason) });
      }

      if (successIds.length > 0) {
        const { error: updErr } = await supabase
          .from("event_reminders")
          .update({ [w.flag]: true })
          .in("id", successIds);
        if (updErr) console.error(`bulk update ${w.flag} failed:`, updErr.message);
      }

      summary[w.label] = {
        targetDate,
        candidates: rows.length,
        sent: successIds.length,
        failed: failures.length,
        failures: failures.slice(0, 10),
      };
    }

    return new Response(JSON.stringify({ ok: true, at: new Date().toISOString(), ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-predefined-reminders error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
