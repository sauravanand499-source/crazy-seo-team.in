import { createClient } from '@supabase/supabase-js';

// Vite env vars are preferred for deployment. The publishable key is safe to expose
// in browser code; never put a Supabase service-role key here.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pbkyoszlgyhpygofemij.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vEsFObkUZcIiVdxMoPo-7A_mFevsgwq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const OWNER_EMAILS = [
  'sauravanand499@gmail.com',
  'crazyseoteam@gmail.com',
];

export const isOwner = (email?: string | null) =>
  !!email && OWNER_EMAILS.includes(email.toLowerCase());
