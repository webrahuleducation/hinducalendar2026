import { CalendarEvent } from "@/types/calendar";
import { hinduEvents2026, getEventsForDate, getEventsForMonth, hasEvents } from "@/data/hinduEvents2026";

export interface PredefinedEventFilters {
  type?: "vrat" | "utsav";
  month?: number;
  search?: string;
}

export const predefinedEventService = {
  getAllEvents(): CalendarEvent[] {
    return hinduEvents2026;
  },

  getEventById(id: string): CalendarEvent | undefined {
    return hinduEvents2026.find(event => event.id === id);
  },

  getEventsForDate(date: string): CalendarEvent[] {
    return getEventsForDate(date);
  },

  getEventsForMonth(month: number, year: number = 2026): CalendarEvent[] {
    return getEventsForMonth(month, year);
  },

  hasEvents(date: string): { hasVrat: boolean; hasUtsav: boolean } {
    return hasEvents(date);
  },

  getFilteredEvents(filters: PredefinedEventFilters): CalendarEvent[] {
    let events = [...hinduEvents2026];

    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }

    if (filters.month !== undefined) {
      const monthStr = String(filters.month + 1).padStart(2, "0");
      events = events.filter(e => e.date.includes(`-${monthStr}-`));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(
        e =>
          e.title.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower)
      );
    }

    return events;
  },

  getVrats(): CalendarEvent[] {
    return hinduEvents2026.filter(e => e.type === "vrat");
  },

  getUtsavs(): CalendarEvent[] {
    return hinduEvents2026.filter(e => e.type === "utsav");
  },

  getUpcomingEvents(limit = 5): CalendarEvent[] {
    const today = new Date().toISOString().split("T")[0];
    return hinduEvents2026
      .filter(e => e.date >= today)
      .slice(0, limit);
  },

  searchEvents(query: string): CalendarEvent[] {
    if (!query.trim()) return [];
    
    const searchLower = query.toLowerCase();
    return hinduEvents2026.filter(
      e =>
        e.title.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower)
    );
  },

  getEventsByCategory(): { vrats: CalendarEvent[]; utsavs: CalendarEvent[] } {
    return {
      vrats: this.getVrats(),
      utsavs: this.getUtsavs(),
    };
  },
};
