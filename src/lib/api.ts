import { Capacitor } from "@capacitor/core";

const baseUrl = "https://safetywatch-backend.onrender.com";

// Ensure no trailing slash
export const BASE_URL = baseUrl;

// Correctly handle /api suffix
export const API_BASE = `${BASE_URL}/api`;

export let VERSION_HEADERS: Record<string, string> = {
    "x-app-version": "1.4.8",
    "x-app-build-id": "0",
    "x-platform": Capacitor.isNativePlatform() ? "App" : "Browser"
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
