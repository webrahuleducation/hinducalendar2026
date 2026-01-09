import { useState, useMemo, useCallback } from "react";
import { CalendarEvent } from "@/types/calendar";
import { hinduEvents2026 } from "@/data/hinduEvents2026";
import { CustomEvent } from "@/services/eventService";
import { parseISO } from "date-fns";

export interface SearchFilters {
  query: string;
  type: "all" | "vrat" | "utsav" | "custom";
  month: number | null; // 0-11 or null for all
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

const defaultFilters: SearchFilters = {
  query: "",
  type: "all",
  month: null,
  dateRange: { start: null, end: null },
};

export function useSearch(customEvents: CustomEvent[] = []) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const filteredPredefinedEvents = useMemo(() => {
    let events = [...hinduEvents2026];

    // Filter by type
    if (filters.type !== "all" && filters.type !== "custom") {
      events = events.filter((e) => e.type === filters.type);
    }

    // Filter by month
    if (filters.month !== null) {
      events = events.filter((e) => {
        const eventDate = parseISO(e.date);
        return eventDate.getMonth() === filters.month;
      });
    }

    // Filter by date range
    if (filters.dateRange.start) {
      events = events.filter((e) => e.date >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      events = events.filter((e) => e.date <= filters.dateRange.end!);
    }

    // Filter by search query
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.significance?.toLowerCase().includes(query)
      );
    }

    return events;
  }, [filters]);

  const filteredCustomEvents = useMemo(() => {
    if (filters.type !== "all" && filters.type !== "custom") {
      return [];
    }

    let events = [...customEvents];

    // Filter by month
    if (filters.month !== null) {
      events = events.filter((e) => {
        const eventDate = parseISO(e.date);
        return eventDate.getMonth() === filters.month;
      });
    }

    // Filter by date range
    if (filters.dateRange.start) {
      events = events.filter((e) => e.date >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      events = events.filter((e) => e.date <= filters.dateRange.end!);
    }

    // Filter by search query
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query)
      );
    }

    return events;
  }, [customEvents, filters]);

  const allFilteredEvents = useMemo(() => {
    if (filters.type === "custom") {
      return filteredCustomEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        type: "custom" as const,
        description: e.description || undefined,
      }));
    }

    const predefined: CalendarEvent[] = filteredPredefinedEvents;
    const custom: CalendarEvent[] = filteredCustomEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      type: "custom" as const,
      description: e.description || undefined,
    }));

    if (filters.type === "all") {
      return [...predefined, ...custom].sort((a, b) => a.date.localeCompare(b.date));
    }

    return predefined;
  }, [filteredPredefinedEvents, filteredCustomEvents, filters.type]);

  const searchSuggestions = useMemo(() => {
    if (!filters.query || filters.query.length < 2) return [];

    const query = filters.query.toLowerCase();
    const suggestions = new Set<string>();

    hinduEvents2026.forEach((event) => {
      if (event.title.toLowerCase().includes(query)) {
        suggestions.add(event.title);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [filters.query]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredPredefinedEvents,
    filteredCustomEvents,
    allFilteredEvents,
    searchSuggestions,
    hasActiveFilters:
      filters.query !== "" ||
      filters.type !== "all" ||
      filters.month !== null ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null,
  };
}
