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
import { useLanguage } from "@/contexts/LanguageContext";

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { isReminderEnabled, toggleReminder } = useRealtimeReminders();
  const { scheduleEventReminder, cancelEventReminder } = useNotifications();
  const { toast } = useToast();
  const { t } = useLanguage();

  const isValidDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const currentDate = isValidDate ? parseDateFromUrl(date) : new Date();
  const dateStr = isValidDate ? date : formatDateForUrl(new Date());
  const isDateValid = !isNaN(currentDate.getTime());
  const events = isDateValid ? getEventsForDate(dateStr) : [];

  const vratEvents = events.filter(e => e.type === "vrat");
  const utsavEvents = events.filter(e => e.type === "utsav");

  const handlePrevDay = () => navigate(`/day/${formatDateForUrl(subDays(currentDate, 1))}`);
  const handleNextDay = () => navigate(`/day/${formatDateForUrl(addDays(currentDate, 1))}`);
  const handleAddEvent = () => navigate(`/event/new?date=${dateStr}`);

  const handleReminderToggle = async (eventId: string, enabled: boolean, eventTitle: string) => {
    try {
      await toggleReminder(eventId, dateStr);
      if (enabled) {
        await scheduleEventReminder(eventId, eventTitle, dateStr);
        toast({ title: t("reminder.set"), description: `${t("reminder.setDesc")} ${eventTitle}` });
      } else {
        cancelEventReminder(eventId);
        toast({ title: t("reminder.removed"), description: t("reminder.removedDesc") });
      }
    } catch (error) {
      console.error("Error toggling reminder:", error);
      toast({ title: t("common.error"), description: "Could not update reminder.", variant: "destructive" });
    }
  };

  const dayOfWeek = isDateValid ? format(currentDate, "EEEE") : "";
  const formattedDate = isDateValid ? format(currentDate, "d MMMM yyyy") : "";
  const isToday = isDateValid && format(new Date(), "yyyy-MM-dd") === dateStr;

  return (
    <AppLayout title={isDateValid ? format(currentDate, "d MMM yyyy") : "Invalid Date"} showBack>
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevDay} className="shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">{dayOfWeek}</p>
            <h1 className="text-2xl font-display font-bold text-foreground">{formattedDate}</h1>
            {isToday && (
              <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                <Sunrise className="h-3 w-3" />{t("common.today")}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextDay} className="shrink-0">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">{t("day.noEvents")}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t("day.noEventsDesc")}</p>
            <Button onClick={handleAddEvent} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />{t("calendar.addCustomEvent")}
            </Button>
          </div>
        ) : (
          <>
            {vratEvents.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />{t("day.vratsSection")}
                </h2>
                <div className="space-y-3">
                  {vratEvents.map((event, index) => (
                    <EventCard key={event.id} event={event}
                      onReminderToggle={(id, enabled) => handleReminderToggle(id, enabled, event.title)}
                      reminderEnabled={isReminderEnabled(event.id)} defaultExpanded={index === 0} />
                  ))}
                </div>
              </section>
            )}
            {utsavEvents.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary" />{t("day.utsavsSection")}
                </h2>
                <div className="space-y-3">
                  {utsavEvents.map((event, index) => (
                    <EventCard key={event.id} event={event}
                      onReminderToggle={(id, enabled) => handleReminderToggle(id, enabled, event.title)}
                      reminderEnabled={isReminderEnabled(event.id)} defaultExpanded={vratEvents.length === 0 && index === 0} />
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
