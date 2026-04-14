import { auth } from "../config/firebase.config";
import { API_URL } from "../config/api.config";

/**
 * Unified API Client for making authenticated requests to the backend.
 * Automatically handles Firebase tokens for Google users and JWT for Email users.
 */
export const apiClient = {
    async fetch(endpoint: string, options: RequestInit = {}) {
        let token = localStorage.getItem("token"); // Try Native JWT first

        // If no native token, try getting Firebase token (for Google users)
        if (!token) {
            const currentUser = auth.currentUser;
            if (currentUser) {
                token = await currentUser.getIdToken();
            }
        }

        const headers = {
            ...options.headers,
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Handle session expired
            console.warn("Session expired or unauthorized");
            // You could trigger a logout or redirect here if needed
        }

        return response;
    },

    async get(endpoint: string, options: RequestInit = {}) {
        return this.fetch(endpoint, { ...options, method: "GET" });
    },

    async post(endpoint: string, body: any, options: RequestInit = {}) {
        return this.fetch(endpoint, { 
            ...options, 
            method: "POST", 
            body: JSON.stringify(body) 
        });
    },

    async put(endpoint: string, body: any, options: RequestInit = {}) {
        return this.fetch(endpoint, { 
            ...options, 
            method: "PUT", 
            body: JSON.stringify(body) 
        });
    }
};
