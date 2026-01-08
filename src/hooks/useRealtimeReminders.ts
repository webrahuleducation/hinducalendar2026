import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EventReminder, reminderService } from "@/services/reminderService";
import { useToast } from "@/hooks/use-toast";

export function useRealtimeReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await reminderService.getReminders(user.id);
      setReminders(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error loading reminders",
        description: "Failed to load your reminders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("event-reminders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_reminders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReminders((prev) => [...prev, payload.new as EventReminder].sort(
              (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
            ));
          } else if (payload.eventType === "UPDATE") {
            setReminders((prev) =>
              prev.map((r) =>
                r.id === (payload.new as EventReminder).id
                  ? (payload.new as EventReminder)
                  : r
              )
            );
          } else if (payload.eventType === "DELETE") {
            setReminders((prev) =>
              prev.filter((r) => r.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isReminderEnabled = useCallback(
    (eventId: string): boolean => {
      const reminder = reminders.find((r) => r.event_id === eventId);
      return reminder?.reminder_enabled ?? false;
    },
    [reminders]
  );

  const toggleReminder = useCallback(
    async (eventId: string, eventDate: string) => {
      if (!user) return;
      
      try {
        await reminderService.toggleReminder(user.id, eventId, eventDate);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update reminder",
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  const refetch = useCallback(() => {
    loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    loading,
    error,
    isReminderEnabled,
    toggleReminder,
    refetch,
  };
}
