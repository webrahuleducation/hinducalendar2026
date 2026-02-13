import { CalendarDay, MonthData } from "@/types/calendar";
import { getEventsForDate } from "@/data/hinduEvents2026";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns";

// Hindu month names corresponding to Gregorian months (approximate)
export const hinduMonthNames: Record<number, string> = {
  0: "Pausha-Magha",      // January
  1: "Magha-Phalguna",    // February
  2: "Phalguna-Chaitra",  // March
  3: "Chaitra-Vaishakha", // April
  4: "Vaishakha-Jyeshtha",// May
  5: "Jyeshtha-Ashadha",  // June
  6: "Ashadha-Shravana",  // July
  7: "Shravana-Bhadrapada",// August
  8: "Bhadrapada-Ashwin", // September
  9: "Ashwin-Kartik",     // October
  10: "Kartik-Margashirsha",// November
  11: "Margashirsha-Pausha",// December
};

// Week day names
export const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Get all days for a month including padding days from adjacent months
export function getMonthDays(month: number, year: number): CalendarDay[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Always pad to 42 cells (6 rows) for consistent height
  const result = days.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const events = getEventsForDate(dateStr);

    return {
      date,
      events,
      isToday: isToday(date),
      isCurrentMonth: isSameMonth(date, monthStart),
    };
  });

  // Fill remaining cells to reach 42
  while (result.length < 42) {
    const lastDate = result[result.length - 1].date;
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    result.push({
      date: nextDate,
      events: getEventsForDate(format(nextDate, "yyyy-MM-dd")),
      isToday: isToday(nextDate),
      isCurrentMonth: false,
    });
  }

  return result;
}

// Generate data for all 12 months of 2026
export function generateYear2026Data(): MonthData[] {
  const year = 2026;
  return Array.from({ length: 12 }, (_, month) => ({
    month,
    year,
    hinduName: hinduMonthNames[month],
    days: getMonthDays(month, year),
  }));
}

// Format date for display
export function formatDateDisplay(date: Date): string {
  return format(date, "d MMMM yyyy");
}

// Format date for URL
export function formatDateForUrl(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Parse date from URL
export function parseDateFromUrl(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Get month name
export function getMonthName(month: number): string {
  return format(new Date(2026, month), "MMMM");
}
