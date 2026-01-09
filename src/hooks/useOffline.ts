import { useState, useEffect, useCallback } from "react";
import {
  isOnline,
  syncPendingChanges,
  getPendingSyncs,
  cacheEvents,
  getCachedEvents,
} from "@/lib/offlineStorage";
import { hinduEvents2026 } from "@/data/hinduEvents2026";
import { useToast } from "@/hooks/use-toast";

export function useOffline() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingSyncs();
    setPendingCount(pending.length);
  }, []);

  // Cache predefined events for offline use
  const cacheAllEvents = useCallback(async () => {
    try {
      await cacheEvents(hinduEvents2026);
    } catch (error) {
      console.error("Failed to cache events:", error);
    }
  }, []);

  // Sync when coming back online
  const syncNow = useCallback(async () => {
    if (!online || syncing) return;

    setSyncing(true);
    try {
      const { synced, failed } = await syncPendingChanges();
      
      if (synced > 0) {
        toast({
          title: "Synced",
          description: `${synced} pending changes synced successfully`,
        });
      }
      
      if (failed > 0) {
        toast({
          title: "Sync issues",
          description: `${failed} changes failed to sync`,
          variant: "destructive",
        });
      }
      
      await updatePendingCount();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, toast, updatePendingCount]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast({
        title: "Back online",
        description: "Your changes will be synced automatically",
      });
      syncNow();
    };

    const handleOffline = () => {
      setOnline(false);
      toast({
        title: "You're offline",
        description: "Changes will be saved locally and synced when back online",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial cache of events
    cacheAllEvents();
    updatePendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [cacheAllEvents, syncNow, toast, updatePendingCount]);

  return {
    online,
    pendingCount,
    syncing,
    syncNow,
    updatePendingCount,
  };
}
