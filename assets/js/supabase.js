// Supabase Client for Frontend
// Usage: import { supabase } from './assets/js/supabase.js';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://kvvfheqxyedqarplafqe.supabase.co';
// Publishable Key (Safe for frontend)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dmZoZXF4eWVkcWFycGxhZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzcsImV4cCI6MjA4NDI4NDgzN30.TICY21JDYQugBaQ-pOJEvCbpoVdmRDA88zDW3tgU9CY';

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
