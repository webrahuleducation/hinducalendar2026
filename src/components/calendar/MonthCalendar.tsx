import { MonthData } from "@/types/calendar";
import { CalendarDayCell } from "./CalendarDayCell";
import { weekDays, getMonthName } from "@/utils/calendarUtils";
import { getEventsForMonth } from "@/data/hinduEvents2026";
import { Badge } from "@/components/ui/badge";

interface MonthCalendarProps {
  monthData: MonthData;
  onDateClick: (date: Date) => void;
}

export function MonthCalendar({ monthData, onDateClick }: MonthCalendarProps) {
  const monthEvents = getEventsForMonth(monthData.month, monthData.year);
  const vratCount = monthEvents.filter((e) => e.type === "vrat").length;
  const utsavCount = monthEvents.filter((e) => e.type === "utsav").length;

  return (
    <div className="h-full flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Month header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              {getMonthName(monthData.month)} {monthData.year}
            </h3>
            <p className="text-xs text-muted-foreground font-hindi">
              {monthData.hinduName}
            </p>
          </div>
          <div className="flex gap-2">
            {vratCount > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {vratCount} Vrat{vratCount > 1 ? "s" : ""}
              </Badge>
            )}
            {utsavCount > 0 && (
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                {utsavCount} Utsav{utsavCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-3 flex-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {monthData.days.map((day, index) => (
            <CalendarDayCell
              key={index}
              day={day}
              onClick={onDateClick}
            />
          ))}
        </div>
      </div>

      {/* Quick event preview */}
      <div className="border-t bg-muted/30 p-3 mt-auto min-h-[72px]">
        {monthEvents.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">Upcoming this month:</p>
            <div className="flex flex-wrap gap-1">
              {monthEvents.slice(0, 3).map((event) => (
                <Badge
                  key={event.id}
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    event.type === "vrat" && "bg-primary/15 text-primary hover:bg-primary/25",
                    event.type === "utsav" && "bg-secondary/15 text-secondary hover:bg-secondary/25"
                  )}
                >
                  {event.title}
                </Badge>
              ))}
              {monthEvents.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{monthEvents.length - 3} more
                </Badge>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No events this month</p>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
