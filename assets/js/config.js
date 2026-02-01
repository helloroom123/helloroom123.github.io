// Global Configuration for Aurora Project

const CONFIG = {
    /**
     * Determine the API Base URL based on the current hostname.
     * This allows the frontend to work on:
     * 1. Localhost
     * 2. Cloudflare Pages / Vercel (Same Origin)
     * 3. GitHub Pages (Cross Origin -> needs absolute URL)
     */
    getApiBaseUrl: () => {
        const hostname = window.location.hostname;
        
        // If running on Vercel or Cloudflare Pages (same origin APIs), or Localhost with proxy
        // Note: For pure local development without proxy, you might need to hardcode the URL.
        if (hostname.includes('vercel.app') || hostname.includes('pages.dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            return ''; // Use relative path (e.g., /api/upload)
        }
        
        // If running on GitHub Pages (or any other static host), we need an absolute URL.
        // Priority: Vercel > Cloudflare (based on user preference)
        // TODO: Replace 'https://aurora-project.pages.dev' with your actual Vercel Project URL if you prefer Vercel.
        // e.g., 'https://your-project-name.vercel.app'
        return 'https://helloroom123-github-io.vercel.app'; 
    }
};

// Expose to global scope
window.CONFIG = CONFIG;
