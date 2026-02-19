import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FCMMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

function base64UrlEncode(data: Uint8Array | string): string {
  const str = typeof data === "string" ? data : String.fromCharCode(...data);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Get OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: serviceAccount.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );

  const unsignedToken = `${header}.${claimSet}`;

  // Handle both actual newlines and literal \n in the PEM key
  const pem = serviceAccount.private_key.replace(/\\n/g, "\n");
  const pemBase64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  
  // Decode the base64 PEM content
  const pemBinary = Uint8Array.from(
    atob(pemBase64),
    (c: string) => c.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemBinary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${header}.${claimSet}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

async function sendFCMMessage(
  accessToken: string,
  projectId: string,
  message: FCMMessage
): Promise<{ success: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: message.token,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data || {},
        webpush: {
          fcm_options: {
            link: message.data?.url || "/calendar",
          },
          notification: {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-120x120.png",
            vibrate: [200, 100, 200],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: errorText };
  }

  await response.json();
  return { success: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not configured");
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error(`Failed to parse service account JSON: ${e.message}`);
    }

    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error("Service account missing required fields (private_key, client_email)");
    }

    const accessToken = await getAccessToken(serviceAccount);

    const { tokens, title, body, data } = await req.json();

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "tokens array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    const invalidTokens: string[] = [];

    for (const token of tokens) {
      const result = await sendFCMMessage(accessToken, serviceAccount.project_id, {
        token,
        title: title || "Hindu Calendar 2026",
        body: body || "You have a notification",
        data: data || {},
      });

      results.push({ token: token.substring(0, 20) + "...", ...result });

      if (!result.success && result.error?.includes("UNREGISTERED")) {
        invalidTokens.push(token);
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      for (const token of invalidTokens) {
        await supabase.from("push_tokens").delete().eq("token", token);
        console.log("Removed invalid token:", token.substring(0, 20) + "...");
      }
    }

    return new Response(
      JSON.stringify({ results, invalidTokensRemoved: invalidTokens.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
