import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  eventId?: string;
  eventDate?: string;
  data?: Record<string, string>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, eventId, eventDate, data }: PushNotificationRequest = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch push tokens for the user
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", userId);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push tokens found for user", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      sound: "default" as const,
      priority: "high" as const,
      data: {
        ...data,
        ...(eventId && { eventId }),
        ...(eventDate && { eventDate }),
      },
    }));

    // Send to Expo Push API
    const expoPushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const expoPushResult = await expoPushResponse.json();

    console.log("Expo Push API response:", expoPushResult);

    // Handle any failed tokens (e.g., DeviceNotRegistered)
    if (expoPushResult.data) {
      const failedTokens: string[] = [];
      
      expoPushResult.data.forEach((result: { status: string; details?: { error?: string } }, index: number) => {
        if (result.status === "error" && result.details?.error === "DeviceNotRegistered") {
          failedTokens.push(tokens[index].token);
        }
      });

      // Remove invalid tokens from database
      if (failedTokens.length > 0) {
        await supabase
          .from("push_tokens")
          .delete()
          .eq("user_id", userId)
          .in("token", failedTokens);
        
        console.log(`Removed ${failedTokens.length} invalid tokens`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: tokens.length,
        result: expoPushResult 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending push notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
