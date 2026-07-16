import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 100;
const CONCURRENCY = 20;
const APPILIX_TIMEOUT_MS = 10_000;

interface ClaimedReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  reminder_time: string;
}

function sanitize(text: string, max = 240): string {
  // Strip control chars, collapse whitespace, trim, cap length.
  return text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function formatEventTimeIST(dateStr: string, timeStr: string | null): string {
  const eventDate = new Date(dateStr + "T00:00:00Z");
  const datePart = eventDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  if (!timeStr) return datePart;
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${datePart} at ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

async function sendAppilixNotification(
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
    const slice = items.slice(i, i + size);
    const settled = await Promise.allSettled(slice.map(worker));
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let totalClaimed = 0;
    let totalSent = 0;
    let totalFailed = 0;
    const failures: Array<Record<string, unknown>> = [];
    const rollbackIds: string[] = [];

    // Drain the queue in batches of BATCH_SIZE. Cap the whole invocation at
    // ~1500 rows so a single 10-minute cron tick can never balloon; the next
    // tick will pick up the remainder.
    for (let round = 0; round < 15; round++) {
      const { data: claimed, error: claimErr } = await supabase.rpc(
        "claim_due_custom_reminders",
        { _limit: BATCH_SIZE },
      );

      if (claimErr) throw new Error(`claim RPC failed: ${claimErr.message}`);
      const batch = (claimed ?? []) as ClaimedReminder[];
      if (batch.length === 0) break;

      totalClaimed += batch.length;
      console.log(`Round ${round + 1}: claimed ${batch.length} reminders`);

      const settled = await processInChunks(batch, CONCURRENCY, async (r) => {
        try {
          const title = sanitize(`🙏 Reminder: ${r.title}`, 120);
          const whenStr = formatEventTimeIST(r.date, r.time);
          const bodyText = sanitize(
            r.description
              ? `${whenStr} — ${r.description}`
              : `Your event is scheduled for ${whenStr}.`,
            500,
          );
          const push = await sendAppilixNotification(
            appKey,
            apiKey,
            title,
            bodyText,
            r.user_id,
          );
          if (!push.ok) {
            throw new Error(`Appilix ${push.status}: ${push.response.slice(0, 200)}`);
          }
          return { id: r.id, ok: true as const };
        } catch (e) {
          return { id: r.id, ok: false as const, error: (e as Error).message };
        }
      });

      for (const s of settled) {
        if (s.status === "fulfilled" && s.value.ok) {
          totalSent++;
        } else {
          totalFailed++;
          const info = s.status === "fulfilled"
            ? s.value
            : { id: "unknown", ok: false, error: String(s.reason) };
          failures.push(info as Record<string, unknown>);
          if ("id" in info && info.id && info.id !== "unknown") {
            rollbackIds.push(info.id as string);
          }
        }
      }

      // Roll back claim for failed sends so the next tick can retry them.
      if (rollbackIds.length > 0) {
        const toRollback = rollbackIds.splice(0, rollbackIds.length);
        const { error: rbErr } = await supabase
          .from("custom_events")
          .update({ reminder_sent: false, updated_at: new Date().toISOString() })
          .in("id", toRollback);
        if (rbErr) {
          console.error("Rollback failed:", rbErr.message);
        }
      }

      // Stop early if the batch wasn't full — queue is drained.
      if (batch.length < BATCH_SIZE) break;
    }

    return new Response(
      JSON.stringify({
        claimed: totalClaimed,
        sent: totalSent,
        failed: totalFailed,
        failures: failures.slice(0, 25),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-appilix-reminders error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});