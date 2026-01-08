import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  language: string;
  theme: string;
  notifications_enabled: boolean;
  reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  language?: string;
  theme?: string;
  notifications_enabled?: boolean;
  reminder_time?: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  },

  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async upsertProfile(userId: string, updates: UpdateProfileInput): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...updates })
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};
