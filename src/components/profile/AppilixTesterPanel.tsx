import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bell, CheckCircle2, XCircle, Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
    setStatus({ kind: "sending" });
    try {
      const { data, error } = await supabase.functions.invoke("appilix-test-push", {
        body: { title, body },
      });
      if (error) {
        console.error("[Appilix Tester] invoke error", error);
        setStatus({ kind: "error", message: error.message });
        return;
      }
      console.log("[Appilix Tester] response", data);
      if (data?.ok) {
        setStatus({ kind: "success", message: "API payload accepted! Check device notification bar." });
      } else {
        setStatus({ kind: "error", message: `Upstream ${data?.status ?? "?"}: ${String(data?.response ?? data?.error ?? "unknown").slice(0, 200)}` });
      }
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