import { supabase } from '../lib/supabase';

export interface TimetableSlot {
  time: string;
  subject: string;
  type: string;
}

export interface WeeklySchedule {
  Monday: TimetableSlot[];
  Tuesday: TimetableSlot[];
  Wednesday: TimetableSlot[];
  Thursday: TimetableSlot[];
  Friday: TimetableSlot[];
  Saturday: TimetableSlot[];
}

export const timetableService = {
  async getTimetable(userId: string): Promise<WeeklySchedule | null> {
    const { data, error } = await supabase
      .from('timetables')
      .select('schedule')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('Error fetching timetable:', error);
      return null;
    }

    return data?.schedule as WeeklySchedule;
  },

  async saveTimetable(userId: string, schedule: WeeklySchedule): Promise<void> {
    // Check if it exists first
    const { data: existing } = await supabase
      .from('timetables')
      .select('id')
      .eq('user_id', userId)
      .single();

    let error;
    
    if (existing) {
      // Update
      const { error: updateError } = await supabase
        .from('timetables')
        .update({ 
          schedule, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('timetables')
        .insert({ 
          user_id: userId, 
          schedule, 
          updated_at: new Date().toISOString() 
        });
      error = insertError;
    }

    if (error) {
      console.error('Error saving timetable:', error);
      throw error;
    }
  },
  
  async mockParseTimetableFile(file: File): Promise<WeeklySchedule> {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Returning the fallback/default schedule exactly as requested by the user
    return {
      Monday: [
        { time: "08:00 - 09:00", subject: "Entrepreneurship Development", type: "Theory" },
        { time: "09:00 - 10:00", subject: "Business Analytics", type: "Theory" },
        { time: "10:00 - 11:00", subject: "Machine Learning & Tools", type: "Theory" },
        { time: "12:00 - 01:00", subject: "Software Development Methodology", type: "Theory" },
        { time: "01:00 - 02:00", subject: "Cloud Services & Application", type: "Theory" },
        { time: "02:00 - 04:00", subject: "Business Analytics", type: "Practical" }
      ],
      Tuesday: [
        { time: "08:00 - 11:00", subject: "Project", type: "Practical" },
        { time: "11:00 - 12:00", subject: "Business Analytics", type: "Theory" },
        { time: "12:00 - 01:00", subject: "Entrepreneurship Development", type: "Theory" },
        { time: "02:00 - 04:00", subject: "Business Analytics", type: "Practical" },
        { time: "04:00 - 05:00", subject: "Cloud Services & Application", type: "Theory" }
      ],
      Wednesday: [
        { time: "08:00 - 10:00", subject: "Machine Learning & Tools", type: "Theory" },
        { time: "10:00 - 11:00", subject: "Entrepreneurship Development", type: "Theory" },
        { time: "12:00 - 02:00", subject: "Machine Learning & Tools", type: "Practical" },
        { time: "02:00 - 04:00", subject: "Cloud Services & Application", type: "Practical" }
      ],
      Thursday: [
        { time: "08:00 - 11:00", subject: "Project", type: "Practical" },
        { time: "11:00 - 12:00", subject: "Business Analytics", type: "Theory" },
        { time: "12:00 - 01:00", subject: "Entrepreneurship Development", type: "Practical" },
        { time: "01:00 - 02:00", subject: "Software Development Methodology", type: "Practical" },
        { time: "03:00 - 04:00", subject: "Software Development Methodology", type: "Theory" },
        { time: "04:00 - 05:00", subject: "Machine Learning & Tools", type: "Theory" }
      ],
      Friday: [
        { time: "10:00 - 11:00", subject: "Cloud Services & Application", type: "Theory" },
        { time: "11:00 - 12:00", subject: "Software Development Methodology", type: "Theory" },
        { time: "12:00 - 01:00", subject: "Software Development Methodology", type: "Theory" },
        { time: "02:00 - 04:00", subject: "Software Development Methodology", type: "Practical" }
      ],
      Saturday: [
        { time: "08:00 - 09:00", subject: "Software Development Methodology", type: "Theory" },
        { time: "09:00 - 10:00", subject: "Software Development Methodology", type: "Theory" },
        { time: "12:00 - 01:00", subject: "Cloud Services & Application", type: "Theory" },
        { time: "01:00 - 02:00", subject: "Cloud Services & Application", type: "Theory" }
      ]
    };
  }
};
