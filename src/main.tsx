import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global 401 Interceptor for Auto-Logout
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
    // Ignore auth routes to prevent endless loops on login failures
    if (url.includes('/api/') && !url.includes('/auth/login') && !url.includes('/auth/signup') && !url.includes('/auth/verify-otp')) {
      if (localStorage.getItem("token")) {
        console.warn("[AUTH] Global 401 detected. Token expired or invalid. Logging out.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth?session_expired=true";
      }
    }
  }
  return response;
};

createRoot(document.getElementById("root")!).render(<App />);
