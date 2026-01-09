import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventCard } from "@/components/events";
import { Button } from "@/components/ui/button";
import { getEventsForDate } from "@/data/hinduEvents2026";
import { parseDateFromUrl, formatDateForUrl } from "@/utils/calendarUtils";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar, Sunrise } from "lucide-react";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { useRealtimeReminders } from "@/hooks/useRealtimeReminders";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { isReminderEnabled, toggleReminder } = useRealtimeReminders();
  const { scheduleEventReminder, cancelEventReminder } = useNotifications();
  const { toast } = useToast();

  // Validate date format (YYYY-MM-DD)
  const isValidDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date);
  
  // Parse date safely - fallback to today if invalid
  const currentDate = isValidDate ? parseDateFromUrl(date) : new Date();
  const dateStr = isValidDate ? date : formatDateForUrl(new Date());
  
  // Verify the parsed date is valid
  const isDateValid = !isNaN(currentDate.getTime());
  
  const events = isDateValid ? getEventsForDate(dateStr) : [];

  const vratEvents = events.filter(e => e.type === "vrat");
  const utsavEvents = events.filter(e => e.type === "utsav");

  const handlePrevDay = () => {
    const prevDate = subDays(currentDate, 1);
    navigate(`/day/${formatDateForUrl(prevDate)}`);
  };

  const handleNextDay = () => {
    const nextDate = addDays(currentDate, 1);
    navigate(`/day/${formatDateForUrl(nextDate)}`);
  };

  const handleAddEvent = () => {
    navigate(`/event/new?date=${dateStr}`);
  };

  const handleReminderToggle = async (eventId: string, enabled: boolean, eventTitle: string) => {
    try {
      await toggleReminder(eventId, dateStr);
      
      if (enabled) {
        await scheduleEventReminder(eventId, eventTitle, dateStr);
        toast({
          title: "Reminder set",
          description: `You'll be reminded about ${eventTitle}`,
        });
      } else {
        cancelEventReminder(eventId);
        toast({
          title: "Reminder removed",
          description: `Reminder for ${eventTitle} has been removed`,
        });
      }
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast({
        title: "Error",
        description: "Could not update reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get day and week info - only format if date is valid
  const dayOfWeek = isDateValid ? format(currentDate, "EEEE") : "";
  const formattedDate = isDateValid ? format(currentDate, "d MMMM yyyy") : "";
  const isToday = isDateValid && format(new Date(), "yyyy-MM-dd") === dateStr;

  return (
    <AppLayout 
      title={isDateValid ? format(currentDate, "d MMM yyyy") : "Invalid Date"} 
      showBack
    >
      {/* Date Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">{dayOfWeek}</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {formattedDate}
            </h1>
            {isToday && (
              <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                <Sunrise className="h-3 w-3" />
                Today
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Events Content */}
      <div className="p-4 space-y-6 pb-24">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">
              No Events
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              There are no Hindu festivals or Vrats on this day.
            </p>
            <Button onClick={handleAddEvent} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Event
            </Button>
          </div>
        ) : (
          <>
            {/* Vrats Section */}
            {vratEvents.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Vrats (Fasting Days)
                </h2>
                <div className="space-y-3">
                  {vratEvents.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onReminderToggle={(id, enabled) => handleReminderToggle(id, enabled, event.title)}
                      reminderEnabled={isReminderEnabled(event.id)}
                      defaultExpanded={index === 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Utsavs Section */}
            {utsavEvents.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                  Utsavs (Festivals)
                </h2>
                <div className="space-y-3">
                  {utsavEvents.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onReminderToggle={(id, enabled) => handleReminderToggle(id, enabled, event.title)}
                      reminderEnabled={isReminderEnabled(event.id)}
                      defaultExpanded={vratEvents.length === 0 && index === 0}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <FloatingActionButton onClick={handleAddEvent} />
    </AppLayout>
  );
}
