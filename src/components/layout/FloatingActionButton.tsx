import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  className,
  "aria-label": ariaLabel = "Add new event",
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90",
        "transition-transform hover:scale-105 active:scale-95",
        className
      )}
      aria-label={ariaLabel}
    >
      {icon || <Plus className="h-6 w-6" />}
    </Button>
  );
}
