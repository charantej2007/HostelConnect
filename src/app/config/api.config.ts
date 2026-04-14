// Dynamic API URL for local dev vs production
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? "http://localhost:5000" : "https://hostelconnect-gg4x.onrender.com");
