import { supabase } from "@/integrations/supabase/client";

export interface EventReminder {
  id: string;
  user_id: string;
  event_id: string;
  event_date: string;
  reminder_enabled: boolean;
  created_at: string;
}

export interface CreateReminderInput {
  event_id: string;
  event_date: string;
  reminder_enabled?: boolean;
}

export const reminderService = {
  async getReminders(userId: string): Promise<EventReminder[]> {
    const { data, error } = await supabase
      .from("event_reminders")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (error) throw error;
    return (data || []) as EventReminder[];
  },

  async getReminder(userId: string, eventId: string): Promise<EventReminder | null> {
    const { data, error } = await supabase
      .from("event_reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    return data as EventReminder | null;
  },

  async createReminder(userId: string, reminder: CreateReminderInput): Promise<EventReminder> {
    const { data, error } = await supabase
      .from("event_reminders")
      .insert({
        user_id: userId,
        event_id: reminder.event_id,
        event_date: reminder.event_date,
        reminder_enabled: reminder.reminder_enabled ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EventReminder;
  },

  async updateReminder(reminderId: string, enabled: boolean): Promise<EventReminder> {
    const { data, error } = await supabase
      .from("event_reminders")
      .update({ reminder_enabled: enabled })
      .eq("id", reminderId)
      .select()
      .single();

    if (error) throw error;
    return data as EventReminder;
  },

  async deleteReminder(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from("event_reminders")
      .delete()
      .eq("id", reminderId);

    if (error) throw error;
  },

  async toggleReminder(userId: string, eventId: string, eventDate: string): Promise<EventReminder | null> {
    const existing = await this.getReminder(userId, eventId);
    
    if (existing) {
      if (existing.reminder_enabled) {
        await this.deleteReminder(existing.id);
        return null;
      } else {
        return await this.updateReminder(existing.id, true);
      }
    } else {
      return await this.createReminder(userId, {
        event_id: eventId,
        event_date: eventDate,
        reminder_enabled: true,
      });
    }
  },

  async getUpcomingReminders(userId: string, limit = 10): Promise<EventReminder[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("event_reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("reminder_enabled", true)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as EventReminder[];
  },
};
