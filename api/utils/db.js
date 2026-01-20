const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvvfheqxyedqarplafqe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dmZoZXF4eWVkcWFycGxhZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg4MzcsImV4cCI6MjA4NDI4NDgzN30.TICY21JDYQugBaQ-pOJEvCbpoVdmRDA88zDW3tgU9CY';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
