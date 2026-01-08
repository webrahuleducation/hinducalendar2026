export type EventType = 'vrat' | 'utsav' | 'custom';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  type: EventType;
  description?: string;
  significance?: string;
  procedures?: string;
  region?: string;
  imageUrl?: string;
}

export interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export interface MonthData {
  month: number; // 0-11
  year: number;
  hinduName: string;
  days: CalendarDay[];
}
