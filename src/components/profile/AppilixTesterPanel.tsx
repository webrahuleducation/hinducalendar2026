import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bell, CheckCircle2, XCircle, Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// NOTE: these are placeholders. For production, proxy this call through an
// edge function so the api_key never ships in the client bundle.
const APPILIX_APP_KEY = import.meta.env.VITE_APPILIX_APP_KEY as string | undefined;
const APPILIX_API_KEY = import.meta.env.VITE_APPILIX_API_KEY as string | undefined;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function AppilixTesterPanel() {
  const { user } = useAuth();
  const [title, setTitle] = useState("🙏 Test from Profile");
  const [body, setBody] = useState("Jai Shree Ram! On-spot Appilix push test.");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleSend = async () => {
    if (!user) {
      setStatus({ kind: "error", message: "You must be signed in to send a test notification." });
      return;
    }
    if (!APPILIX_APP_KEY || !APPILIX_API_KEY) {
      setStatus({
        kind: "error",
        message:
          "Appilix keys missing. Set VITE_APPILIX_APP_KEY and VITE_APPILIX_API_KEY in your env.",
      });
      return;
    }

    setStatus({ kind: "sending" });

    const payload = new URLSearchParams({
      app_key: APPILIX_APP_KEY,
      api_key: APPILIX_API_KEY,
      notification_title: title,
      notification_body: body,
      user_id: user.id,
    }).toString();

    try {
      const res = await fetch("https://appilix.com/api/push-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json",
        },
        body: payload,
      });

      const text = await res.text();
      console.log("[Appilix Tester] response", res.status, text);

      if (!res.ok) {
        setStatus({ kind: "error", message: `HTTP ${res.status}: ${text.slice(0, 200)}` });
        return;
      }
      setStatus({ kind: "success", message: "API payload accepted! Check device notification bar." });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Appilix Tester] fetch failed", err);
      setStatus({ kind: "error", message: `Network error: ${message}` });
    }
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          🔔 Appilix On-Spot Tester
        </CardTitle>
        <CardDescription>
          Fire an immediate push directly to your device via the Appilix API.
          Uses the currently signed-in user's Supabase UUID as <code>user_id</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="appilix-title">Notification Title</Label>
          <Input
            id="appilix-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appilix-body">Notification Body</Label>
          <Textarea
            id="appilix-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification body"
            rows={3}
            maxLength={500}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={status.kind === "sending" || !title.trim() || !body.trim()}
          className="w-full gap-2"
        >
          <Rocket className="h-4 w-4" />
          {status.kind === "sending" ? "Sending..." : "🚀 Notify Me Now"}
        </Button>

        {status.kind === "success" && (
          <div className="flex items-start gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}
        {status.kind === "error" && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{status.message}</span>
          </div>
        )}

        {user && (
          <p className="text-xs text-muted-foreground break-all">
            Target user_id: <span className="font-mono">{user.id}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}