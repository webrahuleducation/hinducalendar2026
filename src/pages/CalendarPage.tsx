import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { MonthCalendar, MonthSelector, TodayButton } from "@/components/calendar";
import { generateYear2026Data, formatDateForUrl } from "@/utils/calendarUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarEvent } from "@/types/calendar";
import { format } from "date-fns";

export default function CalendarPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { events: customEvents } = useRealtimeEvents();
  const [baseYearData] = useState(() => generateYear2026Data());

  // Merge custom events into calendar data
  const yearData = useMemo(() => {
    if (customEvents.length === 0) return baseYearData;
    return baseYearData.map(monthData => ({
      ...monthData,
      days: monthData.days.map(day => {
        const dateStr = format(day.date, "yyyy-MM-dd");
        const customForDay: CalendarEvent[] = customEvents
          .filter(e => e.date === dateStr)
          .map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
            type: "custom" as const,
            description: e.description || undefined,
          }));
        return customForDay.length > 0
          ? { ...day, events: [...day.events, ...customForDay] }
          : day;
      }),
    }));
  }, [baseYearData, customEvents]);
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(() => {
    const now = new Date();
    if (now.getFullYear() === 2026) return now.getMonth();
    return 0;
  });

  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingToMonth = useRef(false);

  const handleDateClick = useCallback((date: Date) => {
    navigate(`/day/${formatDateForUrl(date)}`, { replace: false });
  }, [navigate]);

  const handleAddEvent = useCallback(() => {
    navigate("/event/new");
  }, [navigate]);

  const scrollToMonth = useCallback((month: number) => {
    const element = monthRefs.current[month];
    if (element) {
      isScrollingToMonth.current = true;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentVisibleMonth(month);
      setTimeout(() => { isScrollingToMonth.current = false; }, 500);
    }
  }, []);

  const scrollToToday = useCallback(() => {
    const now = new Date();
    const month = now.getFullYear() === 2026 ? now.getMonth() : 0;
    scrollToMonth(month);
  }, [scrollToMonth]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingToMonth.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const monthIndex = monthRefs.current.findIndex((ref) => ref === entry.target);
            if (monthIndex !== -1) setCurrentVisibleMonth(monthIndex);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -50% 0px" }
    );
    monthRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [yearData]);

  const headerRight = (
    <div className="flex items-center gap-2">
      <TodayButton onClick={scrollToToday} />
      <MonthSelector currentMonth={currentVisibleMonth} onMonthSelect={scrollToMonth} />
    </div>
  );

  return (
    <AppLayout title={t("calendar.title")} headerRight={headerRight}>
      {/* Legend */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-2">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">{t("calendar.vratFast")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            <span className="text-muted-foreground">{t("calendar.utsavFestival")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-custom" />
            <span className="text-muted-foreground">{t("calendar.custom")}</span>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearData.map((monthData, index) => (
            <div key={`${monthData.year}-${monthData.month}`} ref={(el) => (monthRefs.current[index] = el)} className="h-full">
              <MonthCalendar monthData={monthData} onDateClick={handleDateClick} />
            </div>
          ))}
        </div>
        <div className="h-20" />
      </div>

      <FloatingActionButton onClick={handleAddEvent} />
    </AppLayout>
  );
}
