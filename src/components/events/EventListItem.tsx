import { CalendarEvent } from "@/types/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";

interface EventListItemProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  showDate?: boolean;
}

export function EventListItem({ event, onClick, showDate = true }: EventListItemProps) {
  const eventDate = parseISO(event.date);

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        "hover:scale-[1.01] active:scale-[0.99]",
        event.type === "vrat" && "border-l-4 border-l-primary",
        event.type === "utsav" && "border-l-4 border-l-secondary"
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
                  event.type === "utsav" && "bg-secondary/10 text-secondary border-secondary/30"
                )}
              >
                {event.type === "vrat" ? "Vrat" : "Utsav"}
              </Badge>
              {showDate && (
                <span className="text-xs text-muted-foreground">
                  {format(eventDate, "MMM d")}
                </span>
              )}
            </div>
            <h4 className="font-medium text-foreground truncate">
              {event.title}
            </h4>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {event.description}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
