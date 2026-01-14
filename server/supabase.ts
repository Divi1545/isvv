// server/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate the Supabase URL
if (!supabaseUrl) {
  console.error('[Supabase] SUPABASE_URL is not set. Please add it in Secrets.');
  console.error('[Supabase] The URL should be your Supabase project API URL (e.g., https://xxxxx.supabase.co)');
  throw new Error('SUPABASE_URL is required');
}

// Reject database connection strings - must be API URL
if (supabaseUrl.startsWith('postgresql://') || supabaseUrl.includes('@') || supabaseUrl.includes(':5432') || supabaseUrl.includes(':6543')) {
  console.error('[Supabase] ERROR: SUPABASE_URL appears to be a database connection string.');
  console.error('[Supabase] Please use the Supabase API URL instead (e.g., https://xxxxx.supabase.co)');
  console.error('[Supabase] You can find this in your Supabase dashboard: Settings > API > Project URL');
  throw new Error('SUPABASE_URL must be an API URL (https://xxxxx.supabase.co), not a database connection string');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('[Supabase] SUPABASE_URL must start with https://');
  console.error('[Supabase] Example: https://your-project-id.supabase.co');
  throw new Error('SUPABASE_URL must be a valid HTTPS URL');
}

console.log('[Supabase] Connecting to:', supabaseUrl);

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error('[Supabase] Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
}

// Server-side client with service role key (full access)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client for public operations (uses anon key)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || supabaseServiceKey!
);

// Test connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
}
