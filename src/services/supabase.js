import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' },
    global: {
        fetch: (url, options = {}) => {
            return fetch(url, {
                ...options,
                signal: options.signal || AbortSignal.timeout(30000)
            });
        }
    }
});
