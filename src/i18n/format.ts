import { format as dfFormat } from "date-fns";
import { hi } from "date-fns/locale";

const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

/** Convert ASCII digits to Devanagari digits when the language is Hindi. */
export function toLocaleDigits(value: string | number, language: string): string {
  const str = String(value);
  if (language !== "hi") return str;
  return str.replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

/** Format a date with the active language's locale and numerals. */
export function formatLocalized(date: Date, pattern: string, language: string): string {
  const formatted = dfFormat(date, pattern, language === "hi" ? { locale: hi } : undefined);
  return toLocaleDigits(formatted, language);
}
