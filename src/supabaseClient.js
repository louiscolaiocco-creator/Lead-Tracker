import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://moxjjwhjmdlecexkfitp.supabase.co';
const supabaseKey = 'sb_publishable_6USQxSYF1EwyWoDvHvh41Q_EAZbTrHE';

export const supabase = createClient(supabaseUrl, supabaseKey);