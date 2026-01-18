// Supabase Client for Frontend
// Usage: import { supabase } from './assets/js/supabase.js';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://kvvfheqxyedqarplafqe.supabase.co';
// Publishable Key (Safe for frontend)
const supabaseKey = 'sb_publishable_4Rb9MRto0qgAn02E8j33vA_SfJIrHnf';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Example function to fetch data (You can call this in your pages)
export async function testConnection() {
    const { data, error } = await supabase.from('test_table').select('*').limit(1);
    if (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
    console.log('Supabase connected:', data);
    return true;
}
