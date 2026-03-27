// Firebase Cloud Messaging Service Worker
// This file is required by Firebase to handle background push notifications.
// It MUST be at the root of the public directory.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "",
  projectId: self.FIREBASE_PROJECT_ID || "",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: self.FIREBASE_APP_ID || "",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);

  const { title, body } = payload.notification || {};
  const link = payload.data?.link || '/';

  if (title) {
    self.registration.showNotification(title, {
      body: body || '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { link },
      vibrate: [200, 100, 200],
    });
  }
});

// When user clicks the notification, open the app at the correct URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(clients.openWindow(link));
});
