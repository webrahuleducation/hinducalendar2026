import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getEventsForMonth } from "@/data/hinduEvents2026";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"
];

interface MonthMiniProps {
  month: number;
  year: number;
}

function MonthMini({ month, year }: MonthMiniProps) {
  const events = useMemo(() => getEventsForMonth(month, year), [month, year]);
  const vratCount = events.filter(e => e.type === 'vrat').length;
  const utsavCount = events.filter(e => e.type === 'utsav').length;
  const totalEvents = vratCount + utsavCount;

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create array of day numbers with padding
  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [firstDay, daysInMonth]);

  return (
    <div className="flex flex-col items-center p-1">
      <div className="text-[8px] font-semibold text-primary mb-0.5">
        {MONTHS[month]}
      </div>
      <div className="grid grid-cols-7 gap-[1px]">
        {days.slice(0, 35).map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "w-[6px] h-[6px] rounded-[1px] text-[3px] flex items-center justify-center",
              day === null
                ? "bg-transparent"
                : "bg-muted/60"
            )}
          />
        ))}
      </div>
      {totalEvents > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {vratCount > 0 && (
            <span className="text-[5px] text-vrat font-medium">{vratCount}V</span>
          )}
          {utsavCount > 0 && (
            <span className="text-[5px] text-secondary font-medium">{utsavCount}U</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarOverview() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-lg p-3 shadow-spiritual border border-border/50">
      <div className="text-[10px] text-center font-semibold text-foreground mb-2">
        📅 2026 Calendar Overview
      </div>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthMini key={i} month={i} year={2026} />
        ))}
      </div>
      <div className="flex justify-center gap-3 mt-2 text-[8px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-vrat" /> Vrat
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-secondary" /> Utsav
        </span>
      </div>
    </div>
  );
}
