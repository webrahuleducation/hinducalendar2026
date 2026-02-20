import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function useFCMToken() {
  const { user } = useAuth();
  const { toast } = useToast();
  const tokenSaved = useRef(false);

  const saveTokenToSupabase = useCallback(
    async (token: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("push_tokens")
          .upsert(
            {
              user_id: user.id,
              token,
              platform: "web",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,token" }
          );

        if (error) {
          if (error.code === "23505") {
            await supabase
              .from("push_tokens")
              .update({ updated_at: new Date().toISOString() })
              .eq("user_id", user.id)
              .eq("token", token);
          } else {
            console.error("Error saving FCM token:", error);
          }
        } else {
          console.log("FCM token saved to Supabase");
        }
      } catch (err) {
        console.error("Failed to save FCM token:", err);
      }
    },
    [user]
  );

  const removeTokenFromSupabase = useCallback(async () => {
    if (!user) return;
    try {
      await supabase
        .from("push_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", "web");
    } catch (err) {
      console.error("Failed to remove FCM token:", err);
    }
  }, [user]);

  // Request permission + get token (must be called from user gesture)
  const requestAndSaveToken = useCallback(async () => {
    if (!user) {
      console.warn("Cannot save FCM token: user not authenticated");
      return false;
    }

    try {
      const token = await requestFCMToken();
      if (token) {
        await saveTokenToSupabase(token);
        tokenSaved.current = true;
        console.log("FCM token requested and saved successfully");
        return true;
      } else {
        console.warn("FCM token was null — permission denied or unsupported");
        return false;
      }
    } catch (err) {
      console.error("Failed to request/save FCM token:", err);
      return false;
    }
  }, [user, saveTokenToSupabase]);

  // Only auto-register if permission is already granted (no prompt)
  useEffect(() => {
    if (!user || tokenSaved.current) return;

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      requestAndSaveToken();
    }
  }, [user, requestAndSaveToken]);

  useEffect(() => {
    if (!user) {
      tokenSaved.current = false;
    }
  }, [user]);

  // Handle foreground messages
  useEffect(() => {
    onForegroundMessage((payload) => {
      console.log("Foreground message received:", payload);
      toast({
        title: payload.notification?.title || "Notification",
        description: payload.notification?.body || "",
      });
    });
  }, [toast]);

  return {
    requestAndSaveToken,
    removeTokenFromSupabase,
  };
}
