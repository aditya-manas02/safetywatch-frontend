import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-sw.js";

// Ensure the new service worker takes over immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Initialize Firebase inside the service worker
const firebaseConfig = {
  apiKey: "AIzaSyBc2b4BN3k4b2XtJw4R5ldqhUNQWI8TZjs",
  authDomain: "safetywatch-94b0a.firebaseapp.com",
  projectId: "safetywatch-94b0a",
  storageBucket: "safetywatch-94b0a.firebasestorage.app",
  messagingSenderId: "676449036770",
  appId: "1:676449036770:web:5de5cc23cb46245d4d31bb",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Emergency SOS Alert!';
  const body = payload.notification?.body || payload.data?.body || 'An emergency has been reported near you.';
  const link = payload.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { link },
    vibrate: [200, 100, 200],
  });
});

// When user clicks the notification, open the app at the correct URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return self.clients.openWindow(link);
      })
  );
});
