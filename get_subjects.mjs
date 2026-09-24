import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kzpjsgrywgcljgfzlfjz.supabase.co', 'sb_publishable_KKa5iJjsypMO6hPHPKlA2Q_zXV1CJ36');

async function getSubjects() {
  const { data, error } = await supabase.from('subjects').select('*');
  console.log('Subjects:', data);
}

getSubjects();
