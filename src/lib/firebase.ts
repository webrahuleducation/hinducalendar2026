import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAtfSlU6reYkNyCwfvxbgh0KPLYvZgLStg",
  authDomain: "hinducalendar2026.firebaseapp.com",
  projectId: "hinducalendar2026",
  storageBucket: "hinducalendar2026.firebasestorage.app",
  messagingSenderId: "305848368307",
  appId: "1:305848368307:web:239540aa756fd0e91d04c6",
  measurementId: "G-314QMVE6CZ",
};

const VAPID_KEY = "BAz87NpP2zemIEd4SXEPr_dfunxaTghZ7KCS1ySBnvx7fCjHKgiZigzqtm4-vhrC6ismff0f-zd593TPKS66TyQ";

const app = initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) {
    console.log("Firebase Messaging is not supported in this browser");
    return null;
  }
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Wait for service worker registration
    const registration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js")
      || await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("FCM token obtained:", token?.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      onMessage(messaging, callback);
    }
  });
  // Firebase onMessage doesn't return an unsubscribe in all versions, return null
  return null;
}

export { app };
