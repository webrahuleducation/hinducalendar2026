import { supabase } from "@/integrations/supabase/client";

export interface CustomEvent {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string | null;
  description: string | null;
  category: "personal" | "family" | "community";
  reminder_enabled: boolean;
  reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time?: string;
  description?: string;
  category?: "personal" | "family" | "community";
  reminder_enabled?: boolean;
  reminder_time?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export const eventService = {
  async getCustomEvents(userId: string): Promise<CustomEvent[]> {
    const { data, error } = await supabase
      .from("custom_events")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) throw error;
    return (data || []) as CustomEvent[];
  },

  async getCustomEvent(eventId: string): Promise<CustomEvent | null> {
    const { data, error } = await supabase
      .from("custom_events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (error) throw error;
    return data as CustomEvent | null;
  },

  async createCustomEvent(userId: string, event: CreateEventInput): Promise<CustomEvent> {
    const { data, error } = await supabase
      .from("custom_events")
      .insert({
        user_id: userId,
        title: event.title,
        date: event.date,
        time: event.time || null,
        description: event.description || null,
        category: event.category || "personal",
        reminder_enabled: event.reminder_enabled || false,
        reminder_time: event.reminder_time || "1_day_before",
      })
      .select()
      .single();

    if (error) throw error;
    return data as CustomEvent;
  },

  async updateCustomEvent(event: UpdateEventInput): Promise<CustomEvent> {
    const { id, ...updates } = event;
    const { data, error } = await supabase
      .from("custom_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as CustomEvent;
  },

  async deleteCustomEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from("custom_events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
  },

  async getEventsForDate(userId: string, date: string): Promise<CustomEvent[]> {
    const { data, error } = await supabase
      .from("custom_events")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("time", { ascending: true });

    if (error) throw error;
    return (data || []) as CustomEvent[];
  },

  async getUpcomingEvents(userId: string, limit = 10): Promise<CustomEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("custom_events")
      .select("*")
      .eq("user_id", userId)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as CustomEvent[];
  },
};
