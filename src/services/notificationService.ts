// Notification Service using Web Push API and Local Notifications

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: "same_day" | "1_day_before" | "2_days_before" | "1_week_before";
  soundEnabled: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  eventId: string;
  eventDate: string;
}

class NotificationService {
  private permissionGranted = false;

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === "granted";
      return this.permissionGranted;
    }

    return false;
  }

  isSupported(): boolean {
    return "Notification" in window;
  }

  getPermissionStatus(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.permissionGranted && !(await this.requestPermission())) {
      console.log("Notification permission not granted");
      return;
    }

    // Use service worker notification if available for better reliability
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: "/favicon.ico",
        ...options,
      });
    }
  }

  calculateReminderTime(
    eventDate: string,
    reminderSetting: string
  ): Date | null {
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(9, 0, 0, 0); // Default to 9 AM

    const reminderDate = new Date(eventDateTime);

    switch (reminderSetting) {
      case "same_day":
        reminderDate.setHours(6, 0, 0, 0); // 6 AM on event day
        break;
      case "1_day_before":
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(18, 0, 0, 0); // 6 PM day before
        break;
      case "2_days_before":
        reminderDate.setDate(reminderDate.getDate() - 2);
        reminderDate.setHours(18, 0, 0, 0);
        break;
      case "1_week_before":
        reminderDate.setDate(reminderDate.getDate() - 7);
        reminderDate.setHours(9, 0, 0, 0);
        break;
      default:
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(18, 0, 0, 0);
    }

    // Don't schedule if the reminder time is in the past
    if (reminderDate <= new Date()) {
      return null;
    }

    return reminderDate;
  }

  // Store scheduled notifications in localStorage for persistence
  scheduleNotification(notification: ScheduledNotification): void {
    const scheduled = this.getScheduledNotifications();
    const existing = scheduled.findIndex((n) => n.id === notification.id);
    
    if (existing >= 0) {
      scheduled[existing] = notification;
    } else {
      scheduled.push(notification);
    }
    
    localStorage.setItem("scheduled_notifications", JSON.stringify(scheduled));
  }

  cancelNotification(notificationId: string): void {
    const scheduled = this.getScheduledNotifications();
    const filtered = scheduled.filter((n) => n.id !== notificationId);
    localStorage.setItem("scheduled_notifications", JSON.stringify(filtered));
  }

  cancelEventNotifications(eventId: string): void {
    const scheduled = this.getScheduledNotifications();
    const filtered = scheduled.filter((n) => n.eventId !== eventId);
    localStorage.setItem("scheduled_notifications", JSON.stringify(filtered));
  }

  getScheduledNotifications(): ScheduledNotification[] {
    try {
      const stored = localStorage.getItem("scheduled_notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Check and trigger due notifications (call periodically)
  async checkDueNotifications(): Promise<void> {
    const now = new Date();
    const scheduled = this.getScheduledNotifications();
    const due = scheduled.filter((n) => new Date(n.scheduledTime) <= now);
    const remaining = scheduled.filter((n) => new Date(n.scheduledTime) > now);

    for (const notification of due) {
      await this.showNotification(notification.title, {
        body: notification.body,
        tag: notification.id,
        data: { eventId: notification.eventId, eventDate: notification.eventDate },
      });
    }

    if (due.length > 0) {
      localStorage.setItem("scheduled_notifications", JSON.stringify(remaining));
    }
  }
}

export const notificationService = new NotificationService();
