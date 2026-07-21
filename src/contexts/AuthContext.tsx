import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAppilixIdentity } from "@/hooks/useAppilixIdentity";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Mirror the logged-in user's ID into the Appilix JS bridge so
  // push notifications can be targeted by Supabase user_id.
  useAppilixIdentity();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Send a one-time welcome push on successful login (per session)
        if (event === "SIGNED_IN" && session?.user) {
          const flagKey = `welcomeSent:${session.user.id}`;
          if (!sessionStorage.getItem(flagKey)) {
            sessionStorage.setItem(flagKey, "1");
            sendWelcomeNotification(session.user.id, session.user.user_metadata?.full_name || session.user.email || "");
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sendWelcomeNotification(userId: string, name: string) {
    try {
      const { data: tokens } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", userId);

      if (!tokens || tokens.length === 0) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      await fetch(`https://${projectId}.supabase.co/functions/v1/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          tokens: tokens.map((t) => t.token),
          title: "🙏 Welcome to Hindu Calendar 2026",
          body: `Jai Shree Ram, ${name}! 🕉️ Your spiritual companion is ready.`,
          data: { url: "/calendar" },
        }),
      });
    } catch (err) {
      console.error("Welcome notification failed:", err);
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/calendar`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
