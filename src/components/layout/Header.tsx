import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}

export function Header({ 
  title = "Hindu Calendar 2026", 
  showBack = false, 
  rightElement,
  className 
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const canGoBack = showBack && location.key !== "default";

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur-sm",
      className
    )}>
      {canGoBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      <h1 className="flex-1 truncate font-serif text-lg font-semibold text-foreground">
        {title}
      </h1>
      
      {rightElement && (
        <div className="shrink-0">{rightElement}</div>
      )}
    </header>
  );
}
