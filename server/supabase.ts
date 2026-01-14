// server/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseAdmin: SupabaseClient | null = null;
let supabase: SupabaseClient | null = null;
let supabaseConfigured = false;

// Initialize Supabase clients with validation
function initSupabase(): boolean {
  // Check if URL is provided
  if (!supabaseUrl) {
    console.warn('[Supabase] SUPABASE_URL is not set. Supabase features will be disabled.');
    return false;
  }

  // Reject database connection strings - must be API URL
  if (supabaseUrl.startsWith('postgresql://') || 
      (supabaseUrl.includes('@') && !supabaseUrl.includes('.supabase.co')) ||
      supabaseUrl.includes(':5432') || 
      supabaseUrl.includes(':6543')) {
    console.error('[Supabase] ERROR: SUPABASE_URL appears to be a database connection string.');
    console.error('[Supabase] Please use the Supabase API URL instead (e.g., https://xxxxx.supabase.co)');
    console.error('[Supabase] You can find this in your Supabase dashboard: Settings > API > Project URL');
    return false;
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://')) {
    console.error('[Supabase] SUPABASE_URL must start with https://');
    console.error('[Supabase] Example: https://your-project-id.supabase.co');
    return false;
  }

  // Check for API key
  if (!supabaseServiceKey && !supabaseAnonKey) {
    console.warn('[Supabase] Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set.');
    return false;
  }

  try {
    console.log('[Supabase] Connecting to:', supabaseUrl);

    // Server-side client with service role key (full access)
    supabaseAdmin = createClient(
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
    supabase = createClient(
      supabaseUrl,
      supabaseAnonKey || supabaseServiceKey!
    );

    console.log('[Supabase] Client initialized successfully');
    return true;
  } catch (err: any) {
    console.error('[Supabase] Failed to initialize client:', err.message);
    return false;
  }
}

// Initialize on module load
supabaseConfigured = initSupabase();

// Export clients with null checks
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured. Please check SUPABASE_URL and API keys.');
  }
  return supabaseAdmin;
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check SUPABASE_URL and API keys.');
  }
  return supabase;
}

// Check if Supabase is available
export function isSupabaseConfigured(): boolean {
  return supabaseConfigured && supabaseAdmin !== null;
}

// Legacy exports for backward compatibility
export { supabaseAdmin, supabase };

// Test connection
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabaseAdmin) {
    console.warn('[Supabase] Cannot test connection - client not initialized');
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
      return false;
    }
    
    console.log('[Supabase] Connection successful');
    return true;
  } catch (err: any) {
    console.error('[Supabase] Connection error:', err.message);
    return false;
  }
}
