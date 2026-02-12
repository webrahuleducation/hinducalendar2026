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
  Sparkles,
  CalendarPlus
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useShare } from "@/hooks/useShare";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { shareEvent, addToCalendar } = useShare();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleReminderChange = (enabled: boolean) => {
    setReminder(enabled);
    onReminderToggle?.(event.id, enabled);
  };

  const handleShare = async () => {
    const success = await shareEvent(event);
    if (success) {
      toast({
        title: t("common.shareSuccess"),
        description: t("common.shareSuccess"),
      });
    }
    onShare?.(event);
  };

  const handleAddToCalendar = () => {
    addToCalendar(event);
  };

  const eventDate = parseISO(event.date);
  const isCustom = event.type === "custom";

  const getTypeLabel = () => {
    if (event.type === "vrat") return t("calendar.vrat");
    if (event.type === "utsav") return t("calendar.utsav");
    return t("calendar.custom");
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "overflow-hidden transition-all duration-200",
        event.type === "vrat" && "border-l-4 border-l-primary",
        event.type === "utsav" && "border-l-4 border-l-secondary",
        event.type === "custom" && "border-l-4 border-l-custom"
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
                      event.type === "utsav" && "bg-secondary/10 text-secondary border-secondary/30",
                      event.type === "custom" && "bg-custom/10 text-custom border-custom/30"
                    )}
                  >
                    {getTypeLabel()}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(eventDate, "EEEE, d MMMM yyyy")}</span>
            </div>

            {event.significance && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{t("common.significance")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.significance}
                </p>
              </div>
            )}

            {event.procedures && (
              <div className="bg-primary/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{t("common.fastingGuidelines")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.procedures}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                {reminder ? (
                  <Bell className="h-4 w-4 text-accent" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">{t("reminder.enable")}</span>
                <Switch
                  checked={reminder}
                  onCheckedChange={handleReminderChange}
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddToCalendar}
                  className="gap-1.5"
                  title={t("common.addToCalendar")}
                >
                  <CalendarPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  {t("common.share")}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
