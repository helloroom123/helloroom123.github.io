// Common CORS logic
const ALLOWED_ORIGINS = [
  'https://aurora-project.pages.dev',
  'https://helloroom123.github.io',
  'https://helloroom123-github-io.vercel.app',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500' // For local Live Server
];

const getCorsOrigin = (req) => {
  const origin = req.headers.origin || req.headers.Origin;
  if (!origin) return 'null';
  
  // Allow localhost and vercel preview apps dynamically
  if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app') || origin.endsWith('.pages.dev')) {
    return origin;
  }
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  
  return 'null';
};

const setCorsHeaders = (res, origin) => {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Auth-Token, X-Admin-Secret');
    res.setHeader('Access-Control-Max-Age', '86400');
};

module.exports = {
    ALLOWED_ORIGINS,
    getCorsOrigin,
    setCorsHeaders
};
