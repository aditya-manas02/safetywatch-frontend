
const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://safetywatch-backend.onrender.com";

// Ensure no trailing slash
export const BASE_URL = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

// Correctly handle /api suffix
export const API_BASE = `${BASE_URL}/api`;

export const VERSION_HEADERS = {
    "x-app-version": "1.4.8"
};

export const getAuthHeaders = (token: string | null) => ({
    ...VERSION_HEADERS,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    "Content-Type": "application/json"
});
