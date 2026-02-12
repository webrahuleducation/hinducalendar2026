import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type TimeFormat = "12h" | "24h";

interface TimeFormatContextType {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  formatTime: (time24: string) => string;
}

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined);

export function TimeFormatProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>(() => {
    const stored = localStorage.getItem("timeFormat");
    if (stored === "12h" || stored === "24h") return stored;
    return "12h";
  });

  const setTimeFormat = useCallback((format: TimeFormat) => {
    setTimeFormatState(format);
    localStorage.setItem("timeFormat", format);
  }, []);

  const formatTime = useCallback(
    (time24: string): string => {
      if (!time24) return "";
      if (timeFormat === "24h") return time24;
      const [hours, minutes] = time24.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const h = hours % 12 || 12;
      return `${h}:${String(minutes).padStart(2, "0")} ${period}`;
    },
    [timeFormat]
  );

  return (
    <TimeFormatContext.Provider value={{ timeFormat, setTimeFormat, formatTime }}>
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  const context = useContext(TimeFormatContext);
  if (!context) throw new Error("useTimeFormat must be used within TimeFormatProvider");
  return context;
}
