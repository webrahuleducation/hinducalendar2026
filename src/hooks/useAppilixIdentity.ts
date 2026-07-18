import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    appilix?: {
      postMessage?: (message: string) => void;
      setUserIdentity?: (identity: string) => void;
      removeUserIdentity?: () => void;
    };
  }
}

const MAX_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 1000;

/**
 * Resiliently set the Appilix user identity. The Appilix JS bridge
 * (`window.appilix`) is injected by the native Android wrapper after
 * the WebView finishes loading, which may happen AFTER React mounts.
 * We poll every 1s (up to 15 attempts) until the bridge appears.
 */
export function syncAppilixIdentity(userId: string): () => void {
  if (typeof window === "undefined") return () => {};

  const tryOnce = (): boolean => {
    const bridge = window.appilix;
    if (bridge && typeof bridge.postMessage === "function") {
      bridge.postMessage(
        JSON.stringify({
          type: "firebase_record_user_identity",
          props: { user_identity: userId },
        }),
      );
      console.log("[Appilix] ✅ postMessage(firebase_record_user_identity) ->", userId);
      return true;
    }
    return false;
  };

  if (tryOnce()) return () => {};

  let attempts = 0;
  const intervalId = window.setInterval(() => {
    attempts += 1;
    if (tryOnce()) {
      window.clearInterval(intervalId);
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      window.clearInterval(intervalId);
      console.warn(
        `[Appilix] ⚠️ Bridge not available after ${MAX_ATTEMPTS} attempts. ` +
          "This is expected in desktop browsers; inside the Android APK the bridge should be injected."
      );
    }
  }, POLL_INTERVAL_MS);

  return () => window.clearInterval(intervalId);
}

function removeIdentity() {
  if (typeof window === "undefined") return;
  const bridge = window.appilix;
  if (bridge && typeof bridge.postMessage === "function") {
    bridge.postMessage(
      JSON.stringify({
        type: "firebase_record_user_identity",
        props: { user_identity: "" },
      }),
    );
    console.log("[Appilix] postMessage(clear identity)");
  }
}

/**
 * Subscribes to Supabase auth changes and mirrors the logged-in user's
 * UUID into the Appilix Android JS bridge so push notifications can be
 * targeted per-user.
 */
export function useAppilixIdentity() {
  useEffect(() => {
    let cancelPoll: () => void = () => {};

    // Prime on mount from existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        console.log("[Appilix] Existing session detected on mount");
        cancelPoll();
        cancelPoll = syncAppilixIdentity(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Appilix] auth event:", event);
        if (event === "SIGNED_OUT") {
          cancelPoll();
          removeIdentity();
          return;
        }
        if (session?.user?.id) {
          cancelPoll();
          cancelPoll = syncAppilixIdentity(session.user.id);
        }
      }
    );

    return () => {
      cancelPoll();
      subscription.unsubscribe();
    };
  }, []);
}