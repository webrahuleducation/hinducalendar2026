import { WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOffline } from "@/hooks/useOffline";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { online, pendingCount, syncing, syncNow } = useOffline();

  if (online && pendingCount === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 flex justify-center px-4">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 shadow-lg animate-in slide-in-from-top-2",
          online ? "bg-accent/90" : "bg-destructive/90"
        )}
      >
        {!online && (
          <>
            <WifiOff className="h-4 w-4 text-destructive-foreground" />
            <span className="text-sm font-medium text-destructive-foreground">
              Offline
            </span>
          </>
        )}
        
        {pendingCount > 0 && (
          <>
            <Badge variant="secondary" className="text-xs">
              {pendingCount} pending
            </Badge>
            {online && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={syncNow}
                disabled={syncing}
              >
                <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
