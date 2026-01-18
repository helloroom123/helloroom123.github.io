const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvvfheqxyedqarplafqe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_4Rb9MRto0qgAn02E8j33vA_SfJIrHnf';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
