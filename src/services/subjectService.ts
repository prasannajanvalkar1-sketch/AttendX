import { supabase } from '../lib/supabase';
import type { Subject } from '../types';

export const subjectService = {
  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  addSubject: async (subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subject)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  updateSubject: async (subject: Subject): Promise<Subject> => {
    const { data, error } = await supabase
      .from('subjects')
      .update(subject)
      .eq('id', subject.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
