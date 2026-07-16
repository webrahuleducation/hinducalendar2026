import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DueReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  reminder_time: string;
  event_at: string;
  trigger_at: string;
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
  // Target this specific user only (Appilix delivers to devices tagged with this identity)
  form.set("user_identity", userIdentity);

  const res = await fetch("https://appilix.com/api/push-notification", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, response: text };
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

    const nowIso = new Date().toISOString();

    // Fetch reminders whose calculated trigger_at is due
    const { data: due, error } = await supabase
      .from("ready_custom_reminders")
      .select("*")
      .lte("trigger_at", nowIso);

    if (error) throw new Error(`View query failed: ${error.message}`);

    if (!due || due.length === 0) {
      return new Response(
        JSON.stringify({ message: "No due reminders", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Processing ${due.length} due Appilix reminders`);

    const results: Array<Record<string, unknown>> = [];
    let sent = 0;
    let failed = 0;

    for (const r of due as DueReminder[]) {
      const title = `🙏 Reminder: ${r.title}`;
      const whenStr = formatEventTimeIST(r.date, r.time);
      const bodyText = r.description
        ? `${whenStr} — ${r.description}`
        : `Your event is scheduled for ${whenStr}.`;

      const push = await sendAppilixNotification(
        appKey,
        apiKey,
        title,
        bodyText,
        r.user_id,
      );

      if (push.ok) {
        sent++;
        // Mark as sent + bump updated_at so we never re-send
        const { error: updErr } = await supabase
          .from("custom_events")
          .update({ reminder_sent: true, updated_at: new Date().toISOString() })
          .eq("id", r.id);

        if (updErr) {
          console.error(`Failed to mark ${r.id} as sent:`, updErr.message);
          results.push({ id: r.id, sent: true, updated: false, error: updErr.message });
        } else {
          results.push({ id: r.id, sent: true, updated: true });
        }
      } else {
        failed++;
        console.error(
          `Appilix push failed for reminder ${r.id} (status ${push.status}):`,
          push.response,
        );
        results.push({ id: r.id, sent: false, status: push.status, response: push.response });
      }
    }

    return new Response(
      JSON.stringify({ processed: due.length, sent, failed, results }),
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