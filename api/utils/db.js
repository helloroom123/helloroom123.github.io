const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kvvfheqxyedqarplafqe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error('CRITICAL: SUPABASE_KEY is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

module.exports = { supabase };
