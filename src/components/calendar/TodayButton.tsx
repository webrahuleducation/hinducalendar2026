import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

interface TodayButtonProps {
  onClick: () => void;
}

export function TodayButton({ onClick }: TodayButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2 bg-background/80 backdrop-blur-sm"
    >
      <CalendarDays className="h-4 w-4" />
      Today
    </Button>
  );
}
