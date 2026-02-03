
import { createClient } from '@supabase/supabase-js';

// Foydalanuvchi taqdim etgan Supabase sozlamalari
const SUPABASE_URL = 'https://khfovicbjyvuiadvquvh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5SRhM8m8D8U_XBVqKanxSQ_6ZFQWyMw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
