import { getMonthName } from "@/utils/calendarUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectorProps {
  currentMonth: number;
  onMonthSelect: (month: number) => void;
}

export function MonthSelector({ currentMonth, onMonthSelect }: MonthSelectorProps) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: getMonthName(i),
  }));

  return (
    <Select
      value={String(currentMonth)}
      onValueChange={(value) => onMonthSelect(Number(value))}
    >
      <SelectTrigger className="w-[140px] bg-background/80 backdrop-blur-sm">
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
