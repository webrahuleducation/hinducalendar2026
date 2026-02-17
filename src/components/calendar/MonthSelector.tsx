import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const monthTranslationKeys = [
  "month.january", "month.february", "month.march", "month.april",
  "month.may", "month.june", "month.july", "month.august",
  "month.september", "month.october", "month.november", "month.december",
] as const;

interface MonthSelectorProps {
  currentMonth: number;
  onMonthSelect: (month: number) => void;
}

export function MonthSelector({ currentMonth, onMonthSelect }: MonthSelectorProps) {
  const { t } = useLanguage();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: t(monthTranslationKeys[i]),
  }));

  return (
    <Select
      value={String(currentMonth)}
      onValueChange={(value) => onMonthSelect(Number(value))}
    >
      <SelectTrigger className="w-[125px] bg-background/80 backdrop-blur-sm">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month.value} value={String(month.value)}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
