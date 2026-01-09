import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useState, useEffect } from "react";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, showIOSInstructions } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Delay showing the prompt to not interrupt initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!showPrompt || isInstalled || dismissed) return null;

  // iOS-specific instructions (Safari only)
  if (showIOSInstructions) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg animate-in slide-in-from-bottom-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Install App
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <CardDescription className="text-sm flex items-center gap-1 flex-wrap">
            Tap <Share className="inline h-4 w-4 mx-1 text-primary" /> then "Add to Home Screen" to install this app.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Android/Chrome install prompt
  if (!isInstallable) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 shadow-lg animate-in slide-in-from-bottom-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install App
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <CardDescription className="text-sm mb-3">
          Install Hindu Calendar 2026 for quick access and offline use.
        </CardDescription>
        <Button onClick={promptInstall} className="w-full" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Install Now
        </Button>
      </CardContent>
    </Card>
  );
}
