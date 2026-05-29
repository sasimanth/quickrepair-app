import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging is not supported in this browser');
    return;
  }

  try {
    // Wait until service worker is active
    const registration = await navigator.serviceWorker.ready;
    
    // Check if permission is default or denied, request it
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      console.log('Push notification permission denied/dismissed');
      return;
    }

    // Retrieve VAPID public key
    const { data: { publicKey } } = await api.get('/notifications/vapid-public-key');
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe user
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // Send subscription object to backend
    await api.post('/notifications/subscribe', { subscription });
    console.log('✅ Registered for background push alerts');
  } catch (error) {
    console.error('Failed subscribing for push notifications:', error);
  }
};
