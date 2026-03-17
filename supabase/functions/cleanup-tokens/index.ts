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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    // 1. Delete tokens older than 30 days
    const { data: staleTokens, error: staleError } = await supabase
      .from("push_tokens")
      .select("id")
      .lt("updated_at", cutoff);

    if (staleError) throw staleError;

    let staleDeleted = 0;
    if (staleTokens && staleTokens.length > 0) {
      const staleIds = staleTokens.map((t: { id: string }) => t.id);
      const { error: delError } = await supabase
        .from("push_tokens")
        .delete()
        .in("id", staleIds);
      if (delError) throw delError;
      staleDeleted = staleIds.length;
    }

    // 2. Deduplicate: keep only the newest token per user
    const { data: allTokens, error } = await supabase
      .from("push_tokens")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const userLatest = new Map<string, string>();
    const toDelete: string[] = [];

    for (const token of allTokens || []) {
      if (!userLatest.has(token.user_id)) {
        userLatest.set(token.user_id, token.id);
      } else {
        toDelete.push(token.id);
      }
    }

    let dupsDeleted = 0;
    if (toDelete.length > 0) {
      const { error: delError } = await supabase
        .from("push_tokens")
        .delete()
        .in("id", toDelete);
      if (delError) throw delError;
      dupsDeleted = toDelete.length;
    }

    return new Response(
      JSON.stringify({
        message: `Cleaned up ${staleDeleted} stale (>30d) and ${dupsDeleted} duplicate tokens. ${userLatest.size} active tokens remain.`,
        stale_deleted: staleDeleted,
        duplicates_deleted: dupsDeleted,
        active: userLatest.size,
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
