
const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://safetywatch-backend.onrender.com";

// Ensure no trailing slash
export const BASE_URL = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

// Correctly handle /api suffix
export const API_BASE = `${BASE_URL}/api`;

export let VERSION_HEADERS = {
    "x-app-version": "1.4.8",
    "x-app-build-id": "0"
};

export const setVersionMetadata = (version: string, build: string) => {
    VERSION_HEADERS["x-app-version"] = version;
    VERSION_HEADERS["x-app-build-id"] = build;
};

export const getAuthHeaders = (token: string | null) => ({
    ...VERSION_HEADERS,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    "Content-Type": "application/json"
});
