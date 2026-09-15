import { useState } from "react";
import { MonthData } from "@/types/calendar";
import { CalendarDayCell } from "./CalendarDayCell";
import { getEventsForMonth, getLocalizedEventTitle } from "@/data/hinduEvents2026";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { monthTranslationKeys, hinduMonthNamesHi } from "@/i18n/months";
import { toLocaleDigits } from "@/i18n/format";

interface MonthCalendarProps {
  monthData: MonthData;
  onDateClick: (date: Date) => void;
}

export function MonthCalendar({ monthData, onDateClick }: MonthCalendarProps) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const monthEvents = getEventsForMonth(monthData.month, monthData.year);
  const vratCount = monthEvents.filter((e) => e.type === "vrat").length;
  const utsavCount = monthEvents.filter((e) => e.type === "utsav").length;

  const weekDayKeys = [
    "weekday.sun", "weekday.mon", "weekday.tue", "weekday.wed",
    "weekday.thu", "weekday.fri", "weekday.sat",
  ] as const;

  const monthName = t(monthTranslationKeys[monthData.month]);
  const hinduName = language === "hi" ? hinduMonthNamesHi[monthData.month] : monthData.hinduName;
  const visibleEvents = expanded ? monthEvents : monthEvents.slice(0, 3);
  const hiddenCount = monthEvents.length - 3;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              {monthName} {toLocaleDigits(monthData.year, language)}
            </h3>
            <p className="text-xs text-muted-foreground font-hindi">{hinduName}</p>
          </div>
          <div className="flex gap-2">
            {vratCount > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {toLocaleDigits(vratCount, language)} {t("calendar.vrat")}
                {language === "en" && vratCount > 1 ? "s" : ""}
              </Badge>
            )}
            {utsavCount > 0 && (
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                {toLocaleDigits(utsavCount, language)} {t("calendar.utsav")}
                {language === "en" && utsavCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 flex-1">
        <div className="grid grid-cols-7 mb-2">
          {weekDayKeys.map((key) => (
            <div key={key} className="text-center text-xs font-medium text-muted-foreground py-2">
              {t(key)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthData.days.map((day, index) => (
            <CalendarDayCell key={index} day={day} onClick={onDateClick} />
          ))}
        </div>
      </div>

      {monthEvents.length > 0 && (
        <div className="border-t bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-2">{t("library.upcomingThisMonth")}</p>
          <div className="flex flex-wrap gap-1">
            {visibleEvents.map((event) => (
              <Badge
                key={event.id}
                variant="secondary"
                onClick={() => {
                  const [y, m, d] = event.date.split("-").map(Number);
                  onDateClick(new Date(y, m - 1, d));
                }}
                className={cn(
                  "text-xs cursor-pointer transition-colors",
                  event.type === "vrat" && "bg-primary/15 text-primary hover:bg-primary/25",
                  event.type === "utsav" && "bg-secondary/15 text-secondary hover:bg-secondary/25"
                )}
              >
                {getLocalizedEventTitle(event.id, language) || event.title}
              </Badge>
            ))}
            {hiddenCount > 0 && !expanded && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-accent"
                onClick={() => setExpanded(true)}
              >
                +{toLocaleDigits(hiddenCount, language)} {t("library.showMore")}
              </Badge>
            )}
            {expanded && hiddenCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-accent"
                onClick={() => setExpanded(false)}
              >
                {t("library.showLess")}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
