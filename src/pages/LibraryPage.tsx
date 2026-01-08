import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventListItem } from "@/components/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hinduEvents2026 } from "@/data/hinduEvents2026";
import { CalendarEvent } from "@/types/calendar";
import { getMonthName, formatDateForUrl } from "@/utils/calendarUtils";
import { Search, BookOpen, Calendar, Sparkles } from "lucide-react";
import { parseISO } from "date-fns";

export default function LibraryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "vrat" | "utsav">("all");

  // Filter events based on search, month, and tab
  const filteredEvents = useMemo(() => {
    let events = [...hinduEvents2026];

    // Filter by type
    if (activeTab !== "all") {
      events = events.filter(e => e.type === activeTab);
    }

    // Filter by month
    if (selectedMonth !== "all") {
      const monthNum = parseInt(selectedMonth);
      events = events.filter(e => {
        const eventDate = parseISO(e.date);
        return eventDate.getMonth() === monthNum;
      });
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }

    return events;
  }, [searchQuery, selectedMonth, activeTab]);

  // Group events by month for display
  const groupedEvents = useMemo(() => {
    const groups: Record<number, CalendarEvent[]> = {};
    
    filteredEvents.forEach(event => {
      const month = parseISO(event.date).getMonth();
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(event);
    });

    return groups;
  }, [filteredEvents]);

  const handleEventClick = (event: CalendarEvent) => {
    navigate(`/day/${event.date}`);
  };

  // Stats
  const totalVrats = hinduEvents2026.filter(e => e.type === "vrat").length;
  const totalUtsavs = hinduEvents2026.filter(e => e.type === "utsav").length;

  // Month options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: getMonthName(i),
  }));

  return (
    <AppLayout title="Festival Library">
      {/* Stats Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-display font-bold">Hindu Calendar 2026</h1>
        </div>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalVrats}</p>
            <p className="text-xs text-muted-foreground">Vrats</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">{totalUtsavs}</p>
            <p className="text-xs text-muted-foreground">Utsavs</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{hinduEvents2026.length}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="sticky top-14 z-10 bg-background border-b px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search festivals, vrats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="vrat" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Vrats
              </TabsTrigger>
              <TabsTrigger value="utsav" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                Utsavs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 pb-20">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">
              No Results Found
            </h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedMonth("all");
                setActiveTab("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : selectedMonth === "all" ? (
          // Grouped by month view
          <div className="space-y-6">
            {Object.entries(groupedEvents)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([month, events]) => (
                <section key={month}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {getMonthName(Number(month))} 2026
                    <Badge variant="secondary" className="ml-auto">
                      {events.length}
                    </Badge>
                  </h2>
                  <div className="space-y-2">
                    {events.map(event => (
                      <EventListItem
                        key={event.id}
                        event={event}
                        onClick={handleEventClick}
                      />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ) : (
          // Flat list for single month
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                {getMonthName(Number(selectedMonth))} 2026
              </h2>
              <Badge variant="secondary">
                {filteredEvents.length} events
              </Badge>
            </div>
            {filteredEvents.map(event => (
              <EventListItem
                key={event.id}
                event={event}
                onClick={handleEventClick}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
