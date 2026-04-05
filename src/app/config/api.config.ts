// Central API URL config — reads from Vite env var in production
// Set VITE_API_URL in your Vercel project settings to your deployed backend URL
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
