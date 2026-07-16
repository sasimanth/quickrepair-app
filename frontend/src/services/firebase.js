import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api';
import { getDeviceDetails } from './pushNotification';
import { playNotificationSound } from './soundEffects';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let messaging = null;
let isFirebaseInitialized = false;

// Check if credentials are fully configured
if (
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.messagingSenderId && 
  firebaseConfig.appId
) {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    isFirebaseInitialized = true;
    console.log('🔥 Firebase client initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase client SDK:', error);
  }
} else {
  console.warn('⚠️ Firebase client credentials not configured. FCM background pushes running in mock/offline fallback.');
}

export const requestFcmPermission = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('FCM Push is not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('FCM Push notification permission denied.');
      return null;
    }

    if (!isFirebaseInitialized || !messaging) {
      console.log('FCM mock registration: permission granted.');
      return 'mock_fcm_token_' + Math.random().toString(36).substring(2, 10);
    }

    // Wait for active service worker
    const registration = await navigator.serviceWorker.ready;
    
    // Retrieve FCM token using our VAPID key and passing the active SW registration
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('🔥 FCM Device Token retrieved:', token);
      
      // Register token with backend
      const deviceDetails = getDeviceDetails();
      await api.post('/notifications/fcm-token', {
        token,
        ...deviceDetails
      });
      
      console.log('✅ FCM Device Token synced with backend database.');
      return token;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting FCM device token registration:', error);
    return null;
  }
};

// Set up foreground notification listener if FCM is initialized
if (isFirebaseInitialized && messaging) {
  onMessage(messaging, (payload) => {
    console.log('🔥 Foreground FCM notification received:', payload);
    
    // Dispatch native browser notification since the page is in foreground
    if (Notification.permission === 'granted') {
      const { title, body } = payload.notification || {};
      
      // Customize vibrate and actions
      const notificationOptions = {
        body,
        icon: '/logo192.png',
        badge: '/badge.png',
        vibrate: payload.data?.priority === 'high' ? [200, 100, 200] : undefined,
        data: payload.data
      };

      // Play sound effects if high priority and soundEffects service is available
      try {
        if (payload.data?.priority === 'high') {
          playNotificationSound('high');
        } else {
          playNotificationSound('low');
        }
      } catch (e) {
        console.warn('Could not play sound effect:', e);
      }

      new Notification(title || 'Fixvo Alert', notificationOptions);
    }
  });
}

export { messaging, isFirebaseInitialized };
