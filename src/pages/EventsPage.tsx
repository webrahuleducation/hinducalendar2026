import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { eventService, CustomEvent } from "@/services/eventService";
import { hinduEvents2026 } from "@/data/hinduEvents2026";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { Calendar, Star, Clock, ChevronRight, Plus, Sparkles, Bell, History, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (user) loadCustomEvents();
  }, [user]);

  const loadCustomEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setCustomEvents(await eventService.getCustomEvents(user.id));
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const thirtyDaysLater = addDays(today, 30);
  const upcomingPredefined = hinduEvents2026.filter(event => {
    const eventDate = parseISO(event.date);
    return isAfter(eventDate, today) && isBefore(eventDate, thirtyDaysLater);
  }).slice(0, 10);
  const upcomingCustom = customEvents.filter(event => event.date >= todayStr);
  const pastCustom = customEvents
    .filter(event => event.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));
  const allUpcoming = [
    ...upcomingPredefined.map(e => ({ ...e, isCustom: false })),
    ...upcomingCustom.map(e => ({
      id: e.id, title: e.title, date: e.date, type: "custom" as const,
      description: e.description || "", isCustom: true, category: e.category, reminder_enabled: e.reminder_enabled
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const handleAddEvent = () => navigate("/event/new");
  const handleEventClick = (date: string, isCustom: boolean, eventId?: string) => {
    navigate(isCustom && eventId ? `/event/${eventId}` : `/day/${date}`);
  };

  return (
    <AppLayout title={t("nav.myEvents")}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="sticky top-14 z-10 bg-background border-b px-4">
          <TabsList className="grid w-full grid-cols-3 my-2">
            <TabsTrigger value="upcoming" className="gap-1"><Clock className="h-4 w-4" />{t("events.upcoming")}</TabsTrigger>
            <TabsTrigger value="custom" className="gap-1"><Star className="h-4 w-4" />{t("events.myEvents")}</TabsTrigger>
            <TabsTrigger value="all" className="gap-1"><Calendar className="h-4 w-4" />{t("events.all")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="upcoming" className="p-4 pb-20 m-0 space-y-3">
            {allUpcoming.length === 0 ? (
              <EmptyState icon={<Sparkles className="h-12 w-12" />} title={t("events.noUpcoming")} description={t("events.noUpcomingDesc")} />
            ) : (
              allUpcoming.map((event, index) => (
                <EventListCard key={`${event.id}-${index}`} title={event.title} date={event.date}
                  type={event.type} description={event.description} isCustom={event.isCustom}
                  category={(event as any).category} hasReminder={(event as any).reminder_enabled}
                  onClick={() => handleEventClick(event.date, event.isCustom, event.isCustom ? event.id : undefined)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="custom" className="p-4 pb-20 m-0 space-y-3">
            {!user ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{t("events.signInRequired")}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t("events.signInDesc")}</p>
                <Button onClick={() => navigate("/auth")} className="gap-2">{t("common.signIn")}</Button>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
              </div>
            ) : upcomingCustom.length === 0 && pastCustom.length === 0 ? (
              <EmptyState icon={<Plus className="h-12 w-12" />} title={t("events.noCustom")} description={t("events.noCustomDesc")}
                action={<Button onClick={handleAddEvent} className="gap-2"><Plus className="h-4 w-4" />{t("common.add")}</Button>} />
            ) : (
              <>
                {upcomingCustom.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">{t("events.noUpcoming")}</p>
                  </div>
                ) : (
                  upcomingCustom.map(event => (
                    <EventListCard key={event.id} title={event.title} date={event.date}
                      type="custom" description={event.description || ""} isCustom={true}
                      category={event.category} hasReminder={event.reminder_enabled}
                      onClick={() => navigate(`/event/${event.id}`)} />
                  ))
                )}

                {pastCustom.length > 0 && (
                  <div className="pt-8 pb-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-border" />
                      <button
                        onClick={() => setShowPast(v => !v)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <History className="h-3.5 w-3.5" />
                        Past Reminders ({pastCustom.length})
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showPast && "rotate-180")} />
                      </button>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {showPast && (
                      <div className="space-y-3 opacity-75">
                        {pastCustom.map(event => (
                          <EventListCard key={event.id} title={event.title} date={event.date}
                            type="custom" description={event.description || ""} isCustom={true}
                            category={event.category} hasReminder={event.reminder_enabled}
                            onClick={() => navigate(`/event/${event.id}`)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="all" className="p-4 pb-20 m-0">
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />{t("calendar.title")}
                </h2>
                <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/library")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t("events.browseAll")}</p>
                        <p className="text-sm text-muted-foreground">{hinduEvents2026.length} {t("events.browseAllDesc")}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </section>
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />{t("events.customEvents")}
                </h2>
                {!user ? (
                  <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground text-sm">{t("events.signInDesc")}</p></CardContent></Card>
                ) : (
                  <Card><CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{customEvents.length} {t("events.customEvents")}</p>
                        <p className="text-sm text-muted-foreground">{upcomingCustom.length} {t("events.customUpcoming")}</p>
                      </div>
                      <Button size="sm" onClick={handleAddEvent} className="gap-1"><Plus className="h-4 w-4" />{t("common.add")}</Button>
                    </div>
                  </CardContent></Card>
                )}
              </section>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      <FloatingActionButton onClick={handleAddEvent} />
    </AppLayout>
  );
}

interface EventListCardProps {
  title: string; date: string; type: "vrat" | "utsav" | "custom"; description: string;
  isCustom: boolean; category?: string; hasReminder?: boolean; onClick: () => void;
}

function EventListCard({ title, date, type, description, isCustom, category, hasReminder, onClick }: EventListCardProps) {
  const eventDate = parseISO(date);
  const isToday = format(new Date(), "yyyy-MM-dd") === date;
  const { t } = useLanguage();

  const getTypeLabel = () => {
    if (type === "vrat") return t("calendar.vrat");
    if (type === "utsav") return t("calendar.utsav");
    return category || t("events.personal");
  };

  return (
    <Card className={cn("cursor-pointer hover:shadow-md transition-all duration-200",
      type === "vrat" && "border-l-4 border-l-primary",
      type === "utsav" && "border-l-4 border-l-secondary",
      type === "custom" && "border-l-4 border-l-custom"
    )} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={cn("text-xs",
                type === "vrat" && "bg-primary/10 text-primary border-primary/30",
                type === "utsav" && "bg-secondary/10 text-secondary border-secondary/30",
                type === "custom" && "bg-custom/10 text-custom border-custom/30"
              )}>{getTypeLabel()}</Badge>
              {isToday && <Badge variant="secondary" className="text-xs">{t("common.today")}</Badge>}
              {hasReminder && <Bell className="h-3.5 w-3.5 text-accent" />}
            </div>
            <h4 className="font-medium text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">{format(eventDate, "EEEE, d MMMM")}</p>
            {description && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{description}</p>}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode; }
function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground/50 mx-auto mb-4">{icon}</div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
