import { supabase } from '../lib/supabase';
import type { Holiday } from '../types';

export const holidayService = {
  getHolidays: async (): Promise<Holiday[]> => {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date');

    if (error) throw error;
    return data || [];
  },

  addHoliday: async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
    const { data, error } = await supabase
      .from('holidays')
      .insert(holiday)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteHoliday: async (userId: string, date: string): Promise<void> => {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
  }
};
