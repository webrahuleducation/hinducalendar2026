import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    appilix?: {
      setUserIdentity?: (identity: string) => void;
      removeUserIdentity?: () => void;
    };
  }
}

function syncIdentity(userId: string | null) {
  if (typeof window === "undefined") return;
  const bridge = window.appilix;
  if (typeof bridge === "undefined") {
    console.log("[Appilix] Bridge not available (likely running in browser, not Appilix app)");
    return;
  }
  if (userId) {
    if (typeof bridge.setUserIdentity === "function") {
      console.log("[Appilix] setUserIdentity ->", userId);
      bridge.setUserIdentity(userId);
    } else {
      console.warn("[Appilix] setUserIdentity is not a function on bridge");
    }
  } else {
    if (typeof bridge.removeUserIdentity === "function") {
      console.log("[Appilix] removeUserIdentity()");
      bridge.removeUserIdentity();
    } else {
      console.warn("[Appilix] removeUserIdentity is not a function on bridge");
    }
  }
}

/**
 * Subscribes to Supabase auth changes and mirrors the logged-in user's
 * UUID into the Appilix Android JS bridge so push notifications can be
 * targeted per-user.
 */
export function useAppilixIdentity() {
  useEffect(() => {
    // Prime on mount from existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        console.log("[Appilix] Existing session detected on mount");
        syncIdentity(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Appilix] auth event:", event);
        if (event === "SIGNED_OUT") {
          syncIdentity(null);
          return;
        }
        if (session?.user?.id) {
          syncIdentity(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}