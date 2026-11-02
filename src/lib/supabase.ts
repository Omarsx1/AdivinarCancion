import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnv(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

const supabaseUrl = readEnv(import.meta.env.PUBLIC_SUPABASE_URL);
const supabaseAnonKey = readEnv(import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const MISSING_CONFIG_MESSAGE =
  'Falta configurar Supabase: define PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en tu .env y reinicia el servidor.';

let cachedClient: SupabaseClient | null = null;

/** Cliente único y perezoso; devuelve null si falta configuración. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cachedClient === null) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return cachedClient;
}
