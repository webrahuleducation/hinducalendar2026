import calendarImage from "/images/calendar-2026.png";

export default function CalendarOverview() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl px-3">
        <div className="rounded-xl overflow-hidden shadow-spiritual border border-border/50 bg-card">

          <img
            src={calendarImage}
            alt="Hindu Calendar 2026 Overview"
            className="w-full h-auto object-contain"
            loading="lazy"
          />

        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-vrat" />
            Vrat
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary" />
            Utsav
          </span>
        </div>
      </div>
    </div>
  );
}
