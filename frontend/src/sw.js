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

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If the user has a focused window on the technician-dashboard or user dashboard, skip system push display
        const isAppActiveAndFocused = clientList.some((client) => {
          return client.focused && (
            client.url.includes('technician-dashboard') || 
            client.url.includes('dashboard')
          );
        });

        if (isAppActiveAndFocused) {
          console.log('App is currently active and focused. Skipping system push notification to prevent double alerts.');
          return;
        }

        const options = {
          body: payload.body || 'New marketplace activity detected.',
          icon: '/fixvo-icon.png',
          badge: '/fixvo-icon.png',
          vibrate: [300, 100, 300, 100, 400],
          sound: '/sounds/alert.mp3',
          tag: payload.data?.bookingId ? `booking-${payload.data.bookingId}` : 'fixvo-push-alert',
          renotify: true,
          data: payload.data || {},
          actions: [
            {
              action: 'open',
              title: 'View Details 🔍'
            }
          ]
        };

        return self.registration.showNotification(title, options);
      })
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
      // If we find any tab open for our origin, we navigate it and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
          if ('navigate' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      
      // Open new window if no active client window is found
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
