import { CalendarDay } from "@/types/calendar";
import { cn } from "@/lib/utils";

interface CalendarDayCellProps {
  day: CalendarDay;
  onClick: (date: Date) => void;
}

export function CalendarDayCell({ day, onClick }: CalendarDayCellProps) {
  const hasVrat = day.events.some((e) => e.type === "vrat");
  const hasUtsav = day.events.some((e) => e.type === "utsav");
  const hasCustom = day.events.some((e) => e.type === "custom");
  const hasEvents = day.events.length > 0;

  return (
    <button
      onClick={() => onClick(day.date)}
      className={cn(
        "relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-all duration-200",
        "hover:scale-105 active:scale-95",
        !day.isCurrentMonth && "text-muted-foreground/40",
        day.isCurrentMonth && "text-foreground",
        day.isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background font-bold",
        hasEvents && day.isCurrentMonth && "font-medium"
      )}
    >
      {/* Date number */}
      <span className="z-10">{day.date.getDate()}</span>

      {/* Event indicators - stacked dots */}
      {hasEvents && day.isCurrentMonth && (
        <div className="absolute bottom-1 flex gap-0.5">
          {hasVrat && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {hasUtsav && (
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          )}
          {hasCustom && (
            <span className="h-1.5 w-1.5 rounded-full bg-custom" />
          )}
        </div>
      )}

      {/* Background highlight for event days */}
      {hasEvents && day.isCurrentMonth && (
        <div
          className={cn(
            "absolute inset-0.5 rounded-lg -z-0 opacity-20",
            hasCustom && !hasVrat && !hasUtsav && "bg-custom",
            hasUtsav && "bg-secondary",
            hasVrat && !hasUtsav && "bg-primary"
          )}
        />
      )}
    </button>
  );
}
