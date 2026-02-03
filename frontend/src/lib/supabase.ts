import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // helps catch "No API key found in request"
  // (this happens when env vars are missing / wrong)
  // eslint-disable-next-line no-console
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // required for OAuth redirect handling
  },
});

console.log("SUPABASE URL", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY exists?", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
