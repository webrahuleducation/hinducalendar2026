import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TodayButtonProps {
  onClick: () => void;
}

export function TodayButton({ onClick }: TodayButtonProps) {
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2 bg-background/80 backdrop-blur-sm hidden md:inline-flex"
    >
      <CalendarDays className="h-4 w-4" />
      {t("calendar.today")}
    </Button>
  );
}
