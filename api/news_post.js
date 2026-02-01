// Vercel Serverless Function: News Post
// Handles posting news to Supabase with Service Role privileges
const { createClient } = require('@supabase/supabase-js');

// These should be in Vercel Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://kvvfheqxyedqarplafqe.supabase.co';
// WARNING: This key should be the SERVICE_ROLE_KEY, not the ANON_KEY
// But for now, if you only have the Anon Key, make sure RLS allows insert.
// Better practice: Use SERVICE_ROLE_KEY in Env Vars.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const { getCorsOrigin, setCorsHeaders } = require('./utils/cors');

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // CORS
    const allowOrigin = getCorsOrigin(req);
    setCorsHeaders(res, allowOrigin);

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Validate Origin
    if (allowOrigin === 'null') {
        return res.status(403).json({ error: 'Forbidden Origin' });
    }

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // Authentication: Check Admin Secret
    const adminSecret = req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
        // Fallback: If no ADMIN_SECRET env var is set, block all posts to be safe
        console.warn('Blocked unauthorized news post attempt');
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing Admin Secret' });
    }

    try {
        const { title, content, category, imageUrl } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Missing title or content' });
        }

        // Insert into 'news_articles' table
        const { data, error } = await supabase
            .from('news_articles')
            .insert([
                { 
                    title, 
                    content, 
                    category, 
                    image_url: imageUrl,
                    created_at: new Date()
                }
            ])
            .select();

        if (error) throw error;

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error('News Post Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};