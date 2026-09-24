import { supabase } from '../lib/supabase';
import type { Settings } from '../types';

export const settingsService = {
  getSettings: async (userId: string): Promise<Settings | null> => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  updateSettings: async (userId: string, settings: Partial<Settings>): Promise<Settings> => {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
