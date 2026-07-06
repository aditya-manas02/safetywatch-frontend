import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSecurity } from "./lib/security.ts";

initializeSecurity();

// Global 401 Interceptor for Auto-Logout
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
    // Ignore auth routes to prevent endless loops on login failures
    if (url.includes('/api/') && !url.includes('/auth/login') && !url.includes('/auth/signup') && !url.includes('/auth/verify-otp')) {
      // Only redirect if NOT on the auth page to prevent infinite loops
      const isAuthPage = window.location.pathname.startsWith('/auth');
      
      if (!isAuthPage) {
          console.warn("[AUTH] Session expired - redirecting to login.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/auth?session_expired=true";
      } else {
          console.warn("[AUTH] 401 encountered on auth page - suppressing redirect loop.");
          // We still clear stale bits but don't force a reload/redirect
          localStorage.removeItem("token");
      }
    }
  }
  return response;
};

createRoot(document.getElementById("root")!).render(<App />);
