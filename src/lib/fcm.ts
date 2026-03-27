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
 * Handles both Web and Capacitor (Native Mobile) platforms.
 */
export const registerFcmToken = async (authToken: string | null): Promise<void> => {
  if (!authToken) return;

  try {
    const { Capacitor } = await import("@capacitor/core");
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      console.log("[FCM] Native platform detected. Using Capacitor PushNotifications.");
      const { PushNotifications } = await import("@capacitor/push-notifications");
      
      // 1. Request/Check Permissions
      let status = await PushNotifications.checkPermissions();
      if (status.receive === "prompt" || (status.receive as string) === "default") {
        status = await PushNotifications.requestPermissions();
      }

      if (status.receive !== "granted") {
        console.warn("[FCM] Native notification permission NOT granted:", status.receive);
        return;
      }

      // 2. Register for remote notifications (triggers registration event)
      await PushNotifications.register();

      // 3. Listen for the registration token
      return new Promise((resolve) => {
        const successListener = PushNotifications.addListener("registration", async (tokenData) => {
          const nativeToken = tokenData.value;
          console.log("[FCM] Native token received:", nativeToken);
          
          const res = await fetch(`${API_BASE}/users/fcm-token`, {
            method: "POST",
            headers: getAuthHeaders(authToken),
            body: JSON.stringify({ token: nativeToken }),
          });

          if (res.ok) console.log("[FCM] Native token registered successfully.");
          successListener.then(h => h.remove());
          resolve();
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("[FCM] Native registration error:", err);
          resolve();
        });
      });
    } else {
      // --- WEB FLOW ---
      if (!messaging) {
        console.warn("[FCM] Messaging not initialized on web.");
        return;
      }

      if (typeof Notification === "undefined") {
        console.warn("[FCM] Notification API not supported.");
        return;
      }

      let currentPermission = Notification.permission;
      if (currentPermission === "default") {
        currentPermission = await Notification.requestPermission();
      }

      if (currentPermission !== "granted") {
        console.warn("[FCM] Web notification permission denied.");
        return;
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        type: "module",
      });

      const fcmToken = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: registration 
      });

      if (!fcmToken) {
        console.warn("[FCM] Could not get Web FCM token.");
        return;
      }

      const res = await fetch(`${API_BASE}/users/fcm-token`, {
        method: "POST",
        headers: getAuthHeaders(authToken),
        body: JSON.stringify({ token: fcmToken }),
      });

      if (res.ok) {
        console.log("[FCM] Web token registered successfully.");
      }
    }
  } catch (err) {
    console.error("[FCM] Error in registerFcmToken:", err);
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
