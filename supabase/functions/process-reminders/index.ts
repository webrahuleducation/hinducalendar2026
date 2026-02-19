import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Fetch due reminders that haven't been sent yet
    const { data: dueReminders, error: remindersError } = await supabase
      .from("event_reminders")
      .select("*")
      .eq("reminder_enabled", true)
      .eq("reminder_sent", false)
      .lte("reminder_send_at", now)
      .not("reminder_send_at", "is", null);

    if (remindersError) {
      throw new Error(`Error fetching reminders: ${remindersError.message}`);
    }

    if (!dueReminders || dueReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No due reminders", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${dueReminders.length} due reminders`);

    let sent = 0;
    let failed = 0;

    for (const reminder of dueReminders) {
      // Get user's FCM tokens
      const { data: tokens } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", reminder.user_id);

      if (!tokens || tokens.length === 0) {
        console.log(`No tokens for user ${reminder.user_id}`);
        // Mark as sent anyway to avoid retrying forever
        await supabase
          .from("event_reminders")
          .update({ reminder_sent: true })
          .eq("id", reminder.id);
        continue;
      }

      // Send notification via the send-notification function
      const tokenList = tokens.map((t: { token: string }) => t.token);

      const sendRes = await fetch(
        `${supabaseUrl}/functions/v1/send-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            tokens: tokenList,
            title: `🙏 Reminder: ${reminder.event_id}`,
            body: `Your event on ${reminder.event_date} is coming up!`,
            data: {
              eventId: reminder.event_id,
              eventDate: reminder.event_date,
              url: `/day/${reminder.event_date}`,
            },
          }),
        }
      );

      if (sendRes.ok) {
        sent++;
      } else {
        const errText = await sendRes.text();
        console.error(`Failed to send for reminder ${reminder.id}:`, errText);
        failed++;
      }

      // Mark as sent
      await supabase
        .from("event_reminders")
        .update({ reminder_sent: true })
        .eq("id", reminder.id);
    }

    return new Response(
      JSON.stringify({ processed: dueReminders.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-reminders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
