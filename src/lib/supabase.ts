import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const OWNER_EMAILS = [
  'sauravanand499@gmail.com',
  'crazyseoteam@gmail.com',
];

export const isOwner = (email?: string | null) =>
  !!email && OWNER_EMAILS.includes(email.toLowerCase());
