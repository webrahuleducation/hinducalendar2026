/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAtfSlU6reYkNyCwfvxbgh0KPLYvZgLStg",
  authDomain: "hinducalendar2026.firebaseapp.com",
  projectId: "hinducalendar2026",
  storageBucket: "hinducalendar2026.firebasestorage.app",
  messagingSenderId: "305848368307",
  appId: "1:305848368307:web:239540aa756fd0e91d04c6",
  measurementId: "G-314QMVE6CZ",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "Hindu Calendar 2026";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-120x120.png",
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.eventId || "general",
    renotify: true,
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data;
  let targetUrl = "/calendar";

  if (data?.eventDate) {
    targetUrl = `/day/${data.eventDate}`;
  } else if (data?.url) {
    targetUrl = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
