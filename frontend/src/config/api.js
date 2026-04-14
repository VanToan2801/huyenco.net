/**
 * API Configuration
 * Automatically detects environment and sets API base URL
 */

// Detect if running on production domain
const isProduction = window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.startsWith('192.168.');


// API Base URL
// Đã fix cứng sang Render để tránh dính link Railway cũ trên Vercel
const API_HOST = isProduction
    ? 'https://huyenco-backend.onrender.com' 
    : (import.meta.env.VITE_API_URL || '');

// If you want to use a subdomain like api.huyencobattu.com, uncomment below:
// const API_HOST = isProduction 
//     ? 'https://api.huyencobattu.com'
//     : 'http://localhost:8888';

// Export API endpoints
export const API_CONFIG = {
    HOST: API_HOST,
    BASE_URL: `${API_HOST}/api`,
    AUTH: `${API_HOST}/api/auth`,
    CONSULTANT: `${API_HOST}/api/consultant`,
    ADMIN: `${API_HOST}/api/admin`,
    BAZI: `${API_HOST}/api/bazi`,
};

// For debugging
console.log('[API Config] Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('[API Config] API Host:', API_HOST);

export default API_CONFIG;
