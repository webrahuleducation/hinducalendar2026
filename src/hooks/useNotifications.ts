import { useState, useEffect, useCallback } from "react";
import { notificationService, ScheduledNotification } from "@/services/notificationService";

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">(
    notificationService.getPermissionStatus()
  );
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  useEffect(() => {
    // Load scheduled notifications
    setScheduledNotifications(notificationService.getScheduledNotifications());

    // Check for due notifications periodically
    const interval = setInterval(() => {
      notificationService.checkDueNotifications();
      setScheduledNotifications(notificationService.getScheduledNotifications());
    }, 60000); // Check every minute

    // Initial check
    notificationService.checkDueNotifications();

    return () => clearInterval(interval);
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(notificationService.getPermissionStatus());
    return granted;
  }, []);

  const scheduleEventReminder = useCallback(
    async (
      eventId: string,
      eventTitle: string,
      eventDate: string,
      reminderSetting: string = "1_day_before"
    ) => {
      // Ensure permission
      if (permissionStatus !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      const reminderTime = notificationService.calculateReminderTime(eventDate, reminderSetting);
      if (!reminderTime) {
        console.log("Reminder time is in the past, skipping");
        return false;
      }

      const notification: ScheduledNotification = {
        id: `reminder-${eventId}`,
        title: `🙏 Upcoming: ${eventTitle}`,
        body: `Don't forget! ${eventTitle} is ${
          reminderSetting === "same_day" ? "today" : "coming up soon"
        }.`,
        scheduledTime: reminderTime,
        eventId,
        eventDate,
      };

      notificationService.scheduleNotification(notification);
      setScheduledNotifications(notificationService.getScheduledNotifications());
      return true;
    },
    [permissionStatus, requestPermission]
  );

  const cancelEventReminder = useCallback((eventId: string) => {
    notificationService.cancelEventNotifications(eventId);
    setScheduledNotifications(notificationService.getScheduledNotifications());
  }, []);

  const showInstantNotification = useCallback(
    async (title: string, body: string) => {
      if (permissionStatus !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      await notificationService.showNotification(title, { body });
      return true;
    },
    [permissionStatus, requestPermission]
  );

  const isEventScheduled = useCallback(
    (eventId: string) => {
      return scheduledNotifications.some((n) => n.eventId === eventId);
    },
    [scheduledNotifications]
  );

  return {
    permissionStatus,
    isSupported: notificationService.isSupported(),
    requestPermission,
    scheduleEventReminder,
    cancelEventReminder,
    showInstantNotification,
    isEventScheduled,
    scheduledNotifications,
  };
}
