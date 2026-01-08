import { CalendarEvent } from "@/types/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  Bell, 
  BellOff, 
  ChevronDown, 
  Share2, 
  Calendar as CalendarIcon,
  Sparkles 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface EventCardProps {
  event: CalendarEvent;
  onReminderToggle?: (eventId: string, enabled: boolean) => void;
  onShare?: (event: CalendarEvent) => void;
  reminderEnabled?: boolean;
  defaultExpanded?: boolean;
}

export function EventCard({ 
  event, 
  onReminderToggle, 
  onShare,
  reminderEnabled = false,
  defaultExpanded = false 
}: EventCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [reminder, setReminder] = useState(reminderEnabled);

  const handleReminderChange = (enabled: boolean) => {
    setReminder(enabled);
    onReminderToggle?.(event.id, enabled);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} - ${event.description || ''}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
    onShare?.(event);
  };

  const eventDate = parseISO(event.date);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "overflow-hidden transition-all duration-200",
        event.type === "vrat" && "border-l-4 border-l-primary",
        event.type === "utsav" && "border-l-4 border-l-secondary"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs shrink-0",
                      event.type === "vrat" && "bg-primary/10 text-primary border-primary/30",
                      event.type === "utsav" && "bg-secondary/10 text-secondary border-secondary/30"
                    )}
                  >
                    {event.type === "vrat" ? "Vrat" : "Utsav"}
                  </Badge>
                  {reminder && (
                    <Bell className="h-3.5 w-3.5 text-accent" />
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground leading-tight">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {event.description}
                </p>
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {/* Date info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(eventDate, "EEEE, d MMMM yyyy")}</span>
            </div>

            {/* Significance */}
            {event.significance && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Significance</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.significance}
                </p>
              </div>
            )}

            {/* Procedures (for Vrats) */}
            {event.procedures && (
              <div className="bg-primary/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Fasting Guidelines</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.procedures}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                {reminder ? (
                  <Bell className="h-4 w-4 text-accent" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">Reminder</span>
                <Switch
                  checked={reminder}
                  onCheckedChange={handleReminderChange}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
