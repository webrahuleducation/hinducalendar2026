import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  reminder_enabled: boolean;
  reminder_sent: boolean;
  category: string | null;
}

async function sendEmailWithResend(
  to: string,
  subject: string,
  html: string,
  resendApiKey: string,
  retries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Hindu Calendar 2026 <reminders@hinducalendar2026.lovable.app>",
          to: [to],
          subject,
          html,
        }),
      });

      if (res.ok) {
        console.log(`Email sent to ${to} on attempt ${attempt}`);
        return true;
      }

      const errBody = await res.text();
      console.error(`Resend attempt ${attempt} failed (${res.status}):`, errBody);

      if (res.status === 429 || res.status >= 500) {
        // Retry on rate limit or server error
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      // Client error (4xx except 429) — don't retry
      return false;
    } catch (err) {
      console.error(`Resend attempt ${attempt} error:`, err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return false;
}

function buildEmailHtml(event: ReminderEvent): string {
  const eventDate = new Date(event.date + "T00:00:00Z");
  const formattedDate = eventDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const timeStr = event.time
    ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f4f0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ea580c,#f97316);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🙏 Hindu Calendar 2026</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Event Reminder</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">🕉️ ${event.title}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#9a3412;font-size:14px;font-weight:600;">📅 Date</p>
                    <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">${formattedDate}</p>
                    ${timeStr ? `
                    <p style="margin:0 0 8px;color:#9a3412;font-size:14px;font-weight:600;">🕐 Time</p>
                    <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">${timeStr}</p>
                    ` : ""}
                    ${event.category ? `
                    <p style="margin:0 0 8px;color:#9a3412;font-size:14px;font-weight:600;">🏷️ Category</p>
                    <p style="margin:0;color:#1a1a1a;font-size:16px;text-transform:capitalize;">${event.category}</p>
                    ` : ""}
                  </td>
                </tr>
              </table>
              ${event.description ? `
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">${event.description}</p>
              ` : ""}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://hinducalendar2026.lovable.app/day/${event.date}" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      View Event Details →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">Har Har Mahadev 🙏 | Hindu Calendar 2026</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Get events where reminder is enabled, not sent, and date is today or past
    const { data: dueEvents, error: eventsError } = await supabase
      .from("custom_events")
      .select("*")
      .eq("reminder_enabled", true)
      .eq("reminder_sent", false)
      .lte("date", todayStr);

    if (eventsError) throw new Error(`Error fetching events: ${eventsError.message}`);

    if (!dueEvents || dueEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No due email reminders", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${dueEvents.length} email reminders`);

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const event of dueEvents) {
      // Skip events that are more than 7 days in the past
      const eventDate = new Date(event.date + "T00:00:00Z");
      const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        console.log(`Skipping past event ${event.id} (${daysDiff.toFixed(0)} days old)`);
        // Mark as sent to stop retrying
        await supabase
          .from("custom_events")
          .update({ reminder_sent: true })
          .eq("id", event.id);
        skipped++;
        continue;
      }

      // Get user email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(event.user_id);

      if (userError || !userData?.user?.email) {
        console.error(`No email for user ${event.user_id}:`, userError);
        failed++;
        continue;
      }

      const userEmail = userData.user.email;
      const subject = `🙏 Reminder: ${event.title} — ${event.date}`;
      const html = buildEmailHtml(event as ReminderEvent);

      const emailSent = await sendEmailWithResend(userEmail, subject, html, resendApiKey);

      if (emailSent) {
        sent++;
      } else {
        failed++;
      }

      // Mark as sent to prevent duplicates
      await supabase
        .from("custom_events")
        .update({ reminder_sent: true })
        .eq("id", event.id);
    }

    return new Response(
      JSON.stringify({ processed: dueEvents.length, sent, failed, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-email-reminder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
