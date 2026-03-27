// Firebase Cloud Messaging Service Worker
// This file is required by Firebase to handle background push notifications.
// It MUST be at the root of the public directory.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBc2b4BN3k4b2XtJw4R5ldqhUNQWI8TZjs",
  authDomain: "safetywatch-94b0a.firebaseapp.com",
  projectId: "safetywatch-94b0a",
  storageBucket: "safetywatch-94b0a.firebasestorage.app",
  messagingSenderId: "676449036770",
  appId: "1:676449036770:web:5de5cc23cb46245d4d31bb",
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
