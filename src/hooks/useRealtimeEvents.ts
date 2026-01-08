import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CustomEvent, eventService } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";

export function useRealtimeEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await eventService.getCustomEvents(user.id);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error loading events",
        description: "Failed to load your custom events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("custom-events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "custom_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEvents((prev) => [...prev, payload.new as CustomEvent].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ));
          } else if (payload.eventType === "UPDATE") {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === (payload.new as CustomEvent).id
                  ? (payload.new as CustomEvent)
                  : e
              )
            );
          } else if (payload.eventType === "DELETE") {
            setEvents((prev) =>
              prev.filter((e) => e.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refetch = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refetch,
  };
}
