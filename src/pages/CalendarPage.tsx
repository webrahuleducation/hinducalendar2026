import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { MonthCalendar, MonthSelector, TodayButton } from "@/components/calendar";
import { generateYear2026Data, formatDateForUrl } from "@/utils/calendarUtils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [yearData] = useState(() => generateYear2026Data());
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(() => {
    // Default to current month if in 2026, otherwise January
    const now = new Date();
    if (now.getFullYear() === 2026) {
      return now.getMonth();
    }
    return 0;
  });
  
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingToMonth = useRef(false);

  // Handle date click - navigate to day detail
  const handleDateClick = useCallback((date: Date) => {
    navigate(`/day/${formatDateForUrl(date)}`);
  }, [navigate]);

  // Handle add event
  const handleAddEvent = useCallback(() => {
    navigate("/event/new");
  }, [navigate]);

  // Scroll to specific month
  const scrollToMonth = useCallback((month: number) => {
    const element = monthRefs.current[month];
    if (element) {
      isScrollingToMonth.current = true;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentVisibleMonth(month);
      
      // Reset flag after scroll animation
      setTimeout(() => {
        isScrollingToMonth.current = false;
      }, 500);
    }
  }, []);

  // Scroll to today
  const scrollToToday = useCallback(() => {
    const now = new Date();
    const month = now.getFullYear() === 2026 ? now.getMonth() : 0;
    scrollToMonth(month);
  }, [scrollToMonth]);

  // Track visible month on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingToMonth.current) return;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const monthIndex = monthRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (monthIndex !== -1) {
              setCurrentVisibleMonth(monthIndex);
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-100px 0px -50% 0px",
      }
    );

    monthRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [yearData]);

  // Header right element with month selector and today button
  const headerRight = (
    <div className="flex items-center gap-2">
      <TodayButton onClick={scrollToToday} />
      <MonthSelector
        currentMonth={currentVisibleMonth}
        onMonthSelect={scrollToMonth}
      />
    </div>
  );

  return (
    <AppLayout 
      title="Hindu Calendar 2026" 
      headerRight={headerRight}
    >
      {/* Legend */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-2">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Vrat (Fast)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Utsav (Festival)</span>
          </div>
        </div>
      </div>

      {/* Calendar months - responsive grid */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto px-4 py-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yearData.map((monthData, index) => (
            <div
              key={`${monthData.year}-${monthData.month}`}
              ref={(el) => (monthRefs.current[index] = el)}
            >
              <MonthCalendar
                monthData={monthData}
                onDateClick={handleDateClick}
              />
            </div>
          ))}
        </div>
        
        {/* Bottom padding for FAB */}
        <div className="h-20" />
      </div>

      <FloatingActionButton onClick={handleAddEvent} />
    </AppLayout>
  );
}
