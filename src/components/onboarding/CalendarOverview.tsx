import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getEventsForMonth } from "@/data/hinduEvents2026";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface MonthMiniProps {
  month: number;
  year: number;
}

function MonthMini({ month, year }: MonthMiniProps) {
  const events = useMemo(() => getEventsForMonth(month, year), [month, year]);
  
  // Get event dates for highlighting
  const eventDates = useMemo(() => {
    const dates: Record<number, 'vrat' | 'utsav'> = {};
    events.forEach(e => {
      const day = new Date(e.date).getDate();
      dates[day] = e.type as 'vrat' | 'utsav';
    });
    return dates;
  }, [events]);

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create array of day numbers with padding
  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    // Pad to complete last row
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [firstDay, daysInMonth]);

  return (
    <div className="flex flex-col items-center p-1.5 bg-card/50 rounded-md">
      <div className="text-[9px] font-bold text-primary mb-1 uppercase tracking-wide">
        {MONTHS[month]}
      </div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
        {WEEKDAYS.map((day, idx) => (
          <div key={idx} className="w-[14px] h-[10px] text-[6px] text-muted-foreground font-medium flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-[2px]">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "w-[14px] h-[14px] rounded-[2px] text-[7px] flex items-center justify-center font-semibold",
              day === null
                ? "bg-transparent"
                : eventDates[day] === 'vrat'
                  ? "bg-vrat text-vrat-foreground"
                  : eventDates[day] === 'utsav'
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted/50 text-foreground/80"
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarOverview() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-lg p-3 shadow-spiritual border border-border/50">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthMini key={i} month={i} year={2026} />
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-2.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-vrat" /> Vrat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary" /> Utsav
        </span>
      </div>
    </div>
  );
}
