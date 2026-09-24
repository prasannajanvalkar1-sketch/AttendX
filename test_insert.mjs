import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kzpjsgrywgcljgfzlfjz.supabase.co', 'sb_publishable_KKa5iJjsypMO6hPHPKlA2Q_zXV1CJ36');

async function testInsert() {
  const res = await supabase.from('daily_attendance').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    subject_id: '00000000-0000-0000-0000-000000000000',
    attendance_date: '2026-09-24',
    timetable_slot_id: '09:00 - 10:00', // Test if it accepts string
    status: 'present'
  });
  console.log('Insert res:', res.error || 'Success');
}

testInsert();
