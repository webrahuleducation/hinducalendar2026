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

    // Get all tokens grouped by user
    const { data: allTokens, error } = await supabase
      .from("push_tokens")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group by user_id, keep only the newest token per user
    const userLatest = new Map<string, string>();
    const toDelete: string[] = [];

    for (const token of allTokens || []) {
      if (!userLatest.has(token.user_id)) {
        userLatest.set(token.user_id, token.id);
      } else {
        toDelete.push(token.id);
      }
    }

    // Delete old tokens
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("push_tokens")
        .delete()
        .in("id", toDelete);

      if (delError) throw delError;
    }

    return new Response(
      JSON.stringify({
        message: `Cleaned up ${toDelete.length} duplicate tokens, kept ${userLatest.size} active tokens`,
        deleted: toDelete.length,
        kept: userLatest.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("cleanup-tokens error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
