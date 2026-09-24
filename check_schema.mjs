import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kzpjsgrywgcljgfzlfjz.supabase.co', 'sb_publishable_KKa5iJjsypMO6hPHPKlA2Q_zXV1CJ36');

async function checkSchema() {
  const { data, error } = await supabase.from('daily_attendance').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Row:', data[0]);
    if (!data[0]) {
      const res = await supabase.from('daily_attendance').insert({ made_up_column: 1 });
      console.log('Insert error:', res.error);
    }
  }
}

checkSchema();
