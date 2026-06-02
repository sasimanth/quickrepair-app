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

export const getDeviceDetails = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';

  let platform = 'Unknown';
  if (navigator.platform.indexOf('Win') > -1) platform = 'Windows';
  else if (navigator.platform.indexOf('Mac') > -1) platform = 'macOS';
  else if (navigator.platform.indexOf('Linux') > -1) platform = 'Linux';
  else if (/Android/.test(ua)) platform = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) platform = 'iOS';

  return { deviceId, browser, platform };
};

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

    // Send subscription object to backend along with device/session info
    const deviceDetails = getDeviceDetails();
    await api.post('/notifications/subscribe', {
      subscription,
      ...deviceDetails
    });
    console.log('✅ Registered for background push alerts');
  } catch (error) {
    console.error('Failed subscribing for push notifications:', error);
  }
};
