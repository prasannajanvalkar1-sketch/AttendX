import { supabase } from '../lib/supabase';
import type { LeavePlan } from '../types';

export const leavePlanService = {
  getLeavePlans: async (userId: string): Promise<LeavePlan[]> => {
    const { data, error } = await supabase
      .from('leave_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leave plans:', error);
      return [];
    }
    return data || [];
  },

  addLeavePlan: async (plan: Omit<LeavePlan, 'id' | 'created_at'>): Promise<LeavePlan> => {
    const { data, error } = await supabase
      .from('leave_plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteLeavePlan: async (planId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('leave_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
