import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventListItem } from "@/components/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hinduEvents2026 } from "@/data/hinduEvents2026";
import { CalendarEvent } from "@/types/calendar";
import { getMonthName } from "@/utils/calendarUtils";
import { Search, BookOpen, Calendar, Sparkles } from "lucide-react";
import { parseISO } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LibraryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "vrat" | "utsav">("all");

  const filteredEvents = useMemo(() => {
    let events = [...hinduEvents2026];
    if (activeTab !== "all") events = events.filter(e => e.type === activeTab);
    if (selectedMonth !== "all") {
      const monthNum = parseInt(selectedMonth);
      events = events.filter(e => parseISO(e.date).getMonth() === monthNum);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter(e => e.title.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query));
    }
    return events;
  }, [searchQuery, selectedMonth, activeTab]);

  const groupedEvents = useMemo(() => {
    const groups: Record<number, CalendarEvent[]> = {};
    filteredEvents.forEach(event => {
      const month = parseISO(event.date).getMonth();
      if (!groups[month]) groups[month] = [];
      groups[month].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const handleEventClick = (event: CalendarEvent) => navigate(`/day/${event.date}`);
  const totalVrats = hinduEvents2026.filter(e => e.type === "vrat").length;
  const totalUtsavs = hinduEvents2026.filter(e => e.type === "utsav").length;
  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: getMonthName(i) }));

  return (
    <AppLayout title={t("library.title")}>
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-display font-bold">{t("calendar.title")}</h1>
        </div>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalVrats}</p>
            <p className="text-xs text-muted-foreground">{t("calendar.vrat")}</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">{totalUtsavs}</p>
            <p className="text-xs text-muted-foreground">{t("calendar.utsav")}</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{hinduEvents2026.length}</p>
            <p className="text-xs text-muted-foreground">{t("events.all")}</p>
          </div>
        </div>
      </div>

      <div className="sticky top-14 z-10 bg-background border-b px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("library.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]"><Calendar className="h-4 w-4 mr-2" /><SelectValue placeholder={t("library.allMonths")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("library.allMonths")}</SelectItem>
              {months.map(month => (<SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t("library.all")}</TabsTrigger>
              <TabsTrigger value="vrat" className="gap-1"><span className="h-2 w-2 rounded-full bg-primary" />{t("calendar.vrat")}</TabsTrigger>
              <TabsTrigger value="utsav" className="gap-1"><span className="h-2 w-2 rounded-full bg-secondary" />{t("calendar.utsav")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="p-4 pb-20">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">{t("library.noResults")}</h3>
            <p className="text-muted-foreground text-sm">{t("library.noResultsDesc")}</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedMonth("all"); setActiveTab("all"); }}>
              {t("library.clearFilters")}
            </Button>
          </div>
        ) : selectedMonth === "all" ? (
          <div className="space-y-6">
            {Object.entries(groupedEvents).sort(([a], [b]) => Number(a) - Number(b)).map(([month, events]) => (
              <section key={month}>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />{getMonthName(Number(month))} 2026
                  <Badge variant="secondary" className="ml-auto">{events.length}</Badge>
                </h2>
                <div className="space-y-2">
                  {events.map(event => (<EventListItem key={event.id} event={event} onClick={handleEventClick} />))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground">{getMonthName(Number(selectedMonth))} 2026</h2>
              <Badge variant="secondary">{filteredEvents.length} events</Badge>
            </div>
            {filteredEvents.map(event => (<EventListItem key={event.id} event={event} onClick={handleEventClick} />))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
