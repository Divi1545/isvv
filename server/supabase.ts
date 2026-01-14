// server/supabase.ts
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate and format the Supabase URL
if (!supabaseUrl) {
  console.error('SUPABASE_URL is not set. Please add it in Secrets.');
  throw new Error('SUPABASE_URL is required');
}

// Ensure URL has https:// prefix
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Remove trailing slash if present
supabaseUrl = supabaseUrl.replace(/\/$/, '');

console.log('[Supabase] Connecting to:', supabaseUrl);

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error('Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.');
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
