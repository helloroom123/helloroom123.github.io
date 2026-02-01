// Vercel Serverless Function: Auth Proxy
// Hides the real VPS IP from the client
const axios = require('axios');

// Configure this in Vercel Environment Variables
// VPS_AUTH_URL should be a Tunnel URL or HTTPS endpoint, NOT a direct IP
const VPS_AUTH_URL = process.env.VPS_AUTH_URL;
const { getCorsOrigin, setCorsHeaders } = require('./utils/cors');

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

    if (!VPS_AUTH_URL) {
        console.error('Configuration Error: VPS_AUTH_URL is missing.');
        return res.status(500).json({ success: false, message: 'Server Configuration Error' });
    }


    try {
        const { action, ...data } = req.body;
        // action: 'send-code' or 'verify-code'

        let targetUrl = '';
        if (action === 'send-code') targetUrl = `${VPS_AUTH_URL}/send-code`;
        else if (action === 'verify-code') targetUrl = `${VPS_AUTH_URL}/verify-code`;
        else return res.status(400).json({ success: false, message: 'Invalid action' });

        console.log(`Proxying ${action} to VPS...`);

        const response = await axios.post(targetUrl, data, { timeout: 5000 });
        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Auth Proxy Error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ success: false, message: 'Auth Service Unavailable' });
    }
};