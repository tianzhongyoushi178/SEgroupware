import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// If key is missing during build, use a proxy or handle gracefully
// For 'next build' to pass without actual env vars, checking usage is better.
// However, creating the client throws if key is empty.
// We use a fallback if missing, assuming it's build time.
// Note: This means usage will fail at runtime if key is truly missing, which is correct.

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }); // Prevent crash on import, fails on request if invalid
