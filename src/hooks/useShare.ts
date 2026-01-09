import { useCallback } from "react";
import { shareService } from "@/services/shareService";
import { CalendarEvent } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";

export function useShare() {
  const { toast } = useToast();

  const shareEvent = useCallback(
    async (event: CalendarEvent) => {
      const success = await shareService.shareEvent(event);
      if (success && !shareService.isSupported()) {
        toast({
          title: "Copied to clipboard",
          description: "Event details copied to clipboard",
        });
      }
      return success;
    },
    [toast]
  );

  const shareCustomEvent = useCallback(
    async (event: { title: string; date: string; description?: string; category?: string }) => {
      const success = await shareService.shareCustomEvent(event);
      if (success && !shareService.isSupported()) {
        toast({
          title: "Copied to clipboard",
          description: "Event details copied to clipboard",
        });
      }
      return success;
    },
    [toast]
  );

  const addToCalendar = useCallback(
    (event: CalendarEvent | { title: string; date: string; description?: string }) => {
      shareService.downloadICalEvent(event);
      toast({
        title: "Calendar file downloaded",
        description: "Import the .ics file to your calendar app",
      });
    },
    [toast]
  );

  return {
    isSupported: shareService.isSupported(),
    shareEvent,
    shareCustomEvent,
    addToCalendar,
  };
}
