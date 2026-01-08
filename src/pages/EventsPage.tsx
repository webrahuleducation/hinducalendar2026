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
import { formatDateForUrl } from "@/utils/calendarUtils";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { 
  Calendar, 
  Star, 
  Clock, 
  ChevronRight, 
  Plus, 
  Sparkles,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    if (user) {
      loadCustomEvents();
    }
  }, [user]);

  const loadCustomEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const events = await eventService.getCustomEvents(user.id);
      setCustomEvents(events);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get upcoming predefined events (next 30 days)
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const thirtyDaysLater = addDays(today, 30);
  
  const upcomingPredefined = hinduEvents2026.filter(event => {
    const eventDate = parseISO(event.date);
    return isAfter(eventDate, today) && isBefore(eventDate, thirtyDaysLater);
  }).slice(0, 10);

  // Get upcoming custom events
  const upcomingCustom = customEvents.filter(event => {
    return event.date >= todayStr;
  });

  // All upcoming combined
  const allUpcoming = [
    ...upcomingPredefined.map(e => ({ ...e, isCustom: false })),
    ...upcomingCustom.map(e => ({ 
      id: e.id,
      title: e.title,
      date: e.date,
      type: "custom" as const,
      description: e.description || "",
      isCustom: true,
      category: e.category,
      reminder_enabled: e.reminder_enabled
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const handleAddEvent = () => {
    navigate("/event/new");
  };

  const handleEventClick = (date: string, isCustom: boolean, eventId?: string) => {
    if (isCustom && eventId) {
      navigate(`/event/${eventId}`);
    } else {
      navigate(`/day/${date}`);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "family": return "bg-secondary/10 text-secondary border-secondary/30";
      case "community": return "bg-accent/10 text-accent border-accent/30";
      default: return "bg-primary/10 text-primary border-primary/30";
    }
  };

  return (
    <AppLayout title="My Events">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="sticky top-14 z-10 bg-background border-b px-4">
          <TabsList className="grid w-full grid-cols-3 my-2">
            <TabsTrigger value="upcoming" className="gap-1">
              <Clock className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-1">
              <Star className="h-4 w-4" />
              My Events
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1">
              <Calendar className="h-4 w-4" />
              All
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="p-4 pb-20 m-0 space-y-3">
            {allUpcoming.length === 0 ? (
              <EmptyState 
                icon={<Sparkles className="h-12 w-12" />}
                title="No Upcoming Events"
                description="Check back later for upcoming festivals and vrats"
              />
            ) : (
              allUpcoming.map((event, index) => (
                <EventListCard
                  key={`${event.id}-${index}`}
                  title={event.title}
                  date={event.date}
                  type={event.type}
                  description={event.description}
                  isCustom={event.isCustom}
                  category={(event as any).category}
                  hasReminder={(event as any).reminder_enabled}
                  onClick={() => handleEventClick(event.date, event.isCustom, event.isCustom ? event.id : undefined)}
                />
              ))
            )}
          </TabsContent>

          {/* Custom Events Tab */}
          <TabsContent value="custom" className="p-4 pb-20 m-0 space-y-3">
            {!user ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  Sign In Required
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Sign in to create and manage your custom events
                </p>
                <Button onClick={() => navigate("/auth")} className="gap-2">
                  Sign In
                </Button>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-4">Loading events...</p>
              </div>
            ) : customEvents.length === 0 ? (
              <EmptyState 
                icon={<Plus className="h-12 w-12" />}
                title="No Custom Events"
                description="Create your first personal event"
                action={
                  <Button onClick={handleAddEvent} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                }
              />
            ) : (
              customEvents.map(event => (
                <EventListCard
                  key={event.id}
                  title={event.title}
                  date={event.date}
                  type="custom"
                  description={event.description || ""}
                  isCustom={true}
                  category={event.category}
                  hasReminder={event.reminder_enabled}
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              ))
            )}
          </TabsContent>

          {/* All Events Tab */}
          <TabsContent value="all" className="p-4 pb-20 m-0">
            <div className="space-y-6">
              {/* Predefined Events Summary */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Hindu Calendar 2026
                </h2>
                <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/library")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Browse All Festivals & Vrats</p>
                        <p className="text-sm text-muted-foreground">
                          {hinduEvents2026.length} events throughout the year
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Custom Events Summary */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Your Custom Events
                </h2>
                {!user ? (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Sign in to view your custom events
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customEvents.length} Custom Events</p>
                          <p className="text-sm text-muted-foreground">
                            {upcomingCustom.length} upcoming
                          </p>
                        </div>
                        <Button size="sm" onClick={handleAddEvent} className="gap-1">
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
  title: string;
  date: string;
  type: "vrat" | "utsav" | "custom";
  description: string;
  isCustom: boolean;
  category?: string;
  hasReminder?: boolean;
  onClick: () => void;
}

function EventListCard({ 
  title, 
  date, 
  type, 
  description, 
  isCustom, 
  category,
  hasReminder,
  onClick 
}: EventListCardProps) {
  const eventDate = parseISO(date);
  const isToday = format(new Date(), "yyyy-MM-dd") === date;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        type === "vrat" && "border-l-4 border-l-primary",
        type === "utsav" && "border-l-4 border-l-secondary",
        type === "custom" && "border-l-4 border-l-accent"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  type === "vrat" && "bg-primary/10 text-primary border-primary/30",
                  type === "utsav" && "bg-secondary/10 text-secondary border-secondary/30",
                  type === "custom" && category && getCategoryBadgeClass(category)
                )}
              >
                {type === "custom" ? (category || "Personal") : (type === "vrat" ? "Vrat" : "Utsav")}
              </Badge>
              {isToday && (
                <Badge variant="secondary" className="text-xs">Today</Badge>
              )}
              {hasReminder && (
                <Bell className="h-3.5 w-3.5 text-accent" />
              )}
            </div>
            <h4 className="font-medium text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(eventDate, "EEEE, d MMMM")}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {description}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case "family": return "bg-secondary/10 text-secondary border-secondary/30";
    case "community": return "bg-accent/10 text-accent border-accent/30";
    default: return "bg-primary/10 text-primary border-primary/30";
  }
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground/50 mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
