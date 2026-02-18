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
        // Upsert: update if token exists for user, else insert
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
          // If unique constraint fails, try update
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

  const initializeFCM = useCallback(async () => {
    if (!user || tokenSaved.current) return;

    const token = await requestFCMToken();
    if (token) {
      await saveTokenToSupabase(token);
      tokenSaved.current = true;
    }
  }, [user, saveTokenToSupabase]);

  // Initialize FCM when user logs in
  useEffect(() => {
    if (user) {
      initializeFCM();
    } else {
      tokenSaved.current = false;
    }
  }, [user, initializeFCM]);

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
    initializeFCM,
    removeTokenFromSupabase,
  };
}
