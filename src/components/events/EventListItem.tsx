import { CalendarEvent } from "@/types/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedEventTitle, getLocalizedEventDescription } from "@/data/hinduEvents2026";

interface EventListItemProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  showDate?: boolean;
}

export function EventListItem({ event, onClick, showDate = true }: EventListItemProps) {
  const eventDate = parseISO(event.date);
  const { t, language } = useLanguage();
  const localTitle = getLocalizedEventTitle(event.id, language) || event.title;
  const localDesc = getLocalizedEventDescription(event.id, language) || event.description;

  const getTypeLabel = () => {
    if (event.type === "vrat") return t("calendar.vrat");
    if (event.type === "utsav") return t("calendar.utsav");
    return t("calendar.custom");
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        "hover:scale-[1.01] active:scale-[0.99]",
        event.type === "vrat" && "border-l-4 border-l-primary",
        event.type === "utsav" && "border-l-4 border-l-secondary",
        event.type === "custom" && "border-l-4 border-l-custom"
      )}
      onClick={() => onClick?.(event)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  event.type === "vrat" && "bg-primary/10 text-primary border-primary/30",
                  event.type === "utsav" && "bg-secondary/10 text-secondary border-secondary/30",
                  event.type === "custom" && "bg-custom/10 text-custom border-custom/30"
                )}
              >
                {getTypeLabel()}
              </Badge>
              {showDate && (
                <span className="text-xs text-muted-foreground">
                  {format(eventDate, "MMM d")}
                </span>
              )}
            </div>
            <h4 className="font-medium text-foreground truncate">
              {localTitle}
            </h4>
            {localDesc && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {localDesc}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
