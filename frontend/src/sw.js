import { precacheAndRoute } from 'workbox-precaching';

// Precache list injected by Workbox build step
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  try {
    let payload = {};
    if (event.data) {
      payload = event.data.json();
    } else {
      payload = { title: 'Fixvo Alert', body: 'You have a new repair status update' };
    }

    const title = payload.title || 'Fixvo Update 🛠️';
    const options = {
      body: payload.body || 'New marketplace activity detected.',
      icon: '/fixvo-icon.png',
      badge: '/fixvo-icon.png',
      vibrate: [200, 100, 200],
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Push notification processing failed:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if target window already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if not found
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
