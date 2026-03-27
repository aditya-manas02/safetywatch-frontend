import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { API_BASE, getAuthHeaders } from "@/lib/api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all required Firebase config is present
const isConfigured = Object.values(firebaseConfig).every(v => v && v !== "undefined");

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: ReturnType<typeof getMessaging> | null = null;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    messaging = getMessaging(app);
    console.log("[FCM] Firebase initialized.");
  } catch (err) {
    console.warn("[FCM] Firebase init failed:", err);
  }
} else {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v || v === "undefined")
    .map(([k]) => `VITE_FIREBASE_${k.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`);
  
  if (missing.length > 0) {
    console.warn(`[FCM] Push notifications DISABLED. Missing Vercel Env Vars: ${missing.join(", ")}`);
  }
}

/**
 * Request notification permission, get the FCM token, and register it with the backend.
 */
export const registerFcmToken = async (authToken: string | null): Promise<void> => {
  if (!messaging || !authToken) return;

  try {
    let currentPermission = Notification.permission;
    
    if (currentPermission === "default") {
      currentPermission = await Notification.requestPermission();
    }

    if (currentPermission === "denied") {
      console.warn("[FCM] Notification permission denied.");
      return;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const fcmToken = await getToken(messaging, { vapidKey });

    if (!fcmToken) {
      console.warn("[FCM] Could not get FCM token.");
      return;
    }

    // Send the token to the backend to store against the user
    const res = await fetch(`${API_BASE}/users/fcm-token`, {
      method: "POST",
      headers: getAuthHeaders(authToken),
      body: JSON.stringify({ token: fcmToken }),
    });

    if (res.ok) {
      console.log("[FCM] Token registered with backend successfully.");
    } else {
      console.warn("[FCM] Failed to register token with backend:", res.status);
    }
  } catch (err) {
    console.error("[FCM] Error registering FCM token:", err);
  }
};

/**
 * Listen for foreground push notifications and log them.
 * You can replace this with a toast or custom UI if desired.
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
