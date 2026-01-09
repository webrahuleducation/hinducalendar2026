// Share Service using Web Share API

import { CalendarEvent } from "@/types/calendar";
import { format, parseISO } from "date-fns";

export interface ShareData {
  title: string;
  text: string;
  url?: string;
}

class ShareService {
  isSupported(): boolean {
    return typeof navigator !== "undefined" && "share" in navigator;
  }

  canShare(data?: ShareData): boolean {
    if (!this.isSupported()) return false;
    if (!data) return true;
    
    try {
      return navigator.canShare?.(data) ?? true;
    } catch {
      return true;
    }
  }

  async share(data: ShareData): Promise<boolean> {
    if (!this.isSupported()) {
      // Fallback to clipboard
      return this.copyToClipboard(data);
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // User cancelled sharing
        return false;
      }
      // Fallback to clipboard on other errors
      return this.copyToClipboard(data);
    }
  }

  async shareEvent(event: CalendarEvent): Promise<boolean> {
    const eventDate = parseISO(event.date);
    const formattedDate = format(eventDate, "EEEE, d MMMM yyyy");
    
    const text = [
      `🙏 ${event.title}`,
      `📅 ${formattedDate}`,
      event.type === "vrat" ? "🕉️ Vrat (Fasting Day)" : "🎉 Utsav (Festival)",
      "",
      event.description || "",
      event.significance ? `\n✨ Significance: ${event.significance}` : "",
      "",
      "📱 Hindu Vrat & Utsav Calendar 2026",
    ]
      .filter(Boolean)
      .join("\n");

    return this.share({
      title: event.title,
      text,
      url: `${window.location.origin}/day/${event.date}`,
    });
  }

  async shareCustomEvent(event: {
    title: string;
    date: string;
    description?: string;
    category?: string;
  }): Promise<boolean> {
    const eventDate = parseISO(event.date);
    const formattedDate = format(eventDate, "EEEE, d MMMM yyyy");
    
    const text = [
      `📅 ${event.title}`,
      `🗓️ ${formattedDate}`,
      event.category ? `📁 ${event.category}` : "",
      "",
      event.description || "",
      "",
      "📱 Hindu Vrat & Utsav Calendar 2026",
    ]
      .filter(Boolean)
      .join("\n");

    return this.share({
      title: event.title,
      text,
    });
  }

  private async copyToClipboard(data: ShareData): Promise<boolean> {
    try {
      const text = [data.title, data.text, data.url].filter(Boolean).join("\n\n");
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // Generate calendar file content (iCal format)
  generateICalEvent(event: CalendarEvent | {
    title: string;
    date: string;
    description?: string;
  }): string {
    const eventDate = parseISO(event.date);
    const startDate = format(eventDate, "yyyyMMdd");
    const endDate = format(new Date(eventDate.getTime() + 86400000), "yyyyMMdd"); // +1 day for all-day event
    const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    
    const description = (event as CalendarEvent).significance 
      ? `${event.description || ""}\n\nSignificance: ${(event as CalendarEvent).significance}`
      : event.description || "";

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hindu Calendar 2026//EN",
      "BEGIN:VEVENT",
      `UID:${event.date}-${event.title.replace(/\s+/g, "-")}@hinducalendar`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  }

  downloadICalEvent(event: CalendarEvent | {
    title: string;
    date: string;
    description?: string;
  }): void {
    const icalContent = this.generateICalEvent(event);
    const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const shareService = new ShareService();
