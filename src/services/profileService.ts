import { supabase } from '../lib/supabase';
import type { StudentProfile } from '../types';

export const profileService = {
  getProfile: async (userId: string): Promise<StudentProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  createOrUpdateProfile: async (profile: StudentProfile): Promise<StudentProfile> => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
