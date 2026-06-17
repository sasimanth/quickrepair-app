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
    const priority = payload.data?.priority || 'low';
    const bookingId = payload.data?.bookingId || null;

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Post message to all matching client tabs (so foreground tabs can play sound and update state in real-time)
        clientList.forEach((client) => {
          client.postMessage({
            type: 'push_received',
            payload: payload
          });
        });

        // Check if the user is actively using the dashboard page
        const isAppActiveAndFocused = clientList.some((client) => {
          return client.focused && (
            client.url.includes('technician-dashboard') || 
            client.url.includes('dashboard')
          );
        });

        // Suppress browser system notification if they are already focused on the page to prevent duplicate notifications
        if (isAppActiveAndFocused) {
          console.log('App is currently active and focused. Relying on in-app alerts.');
          return;
        }

        // Set vibration pattern based on priority (high priority gets strong patterns)
        let vibratePattern = [100];
        if (priority === 'high') {
          vibratePattern = [500, 250, 500, 250, 500, 250, 500, 250, 1000]; // Uber-like vibration
        }

        const redirectUrl = payload.data?.url || '/dashboard';
        const isTechRequest = redirectUrl.includes('technician-dashboard');

        const options = {
          body: payload.body || 'New marketplace activity detected.',
          icon: '/fixvo-icon.png',
          badge: '/fixvo-icon.png',
          vibrate: vibratePattern,
          sound: priority === 'high' ? '/sounds/booking_request.wav' : '/sounds/subtle_notification.wav',
          tag: bookingId ? `booking-${bookingId}` : 'fixvo-push-alert',
          renotify: true,
          requireInteraction: priority === 'high',
          visibility: 'public',
          data: payload.data || {},
          actions: isTechRequest 
            ? [
                {
                  action: 'open',
                  title: 'View Job 🔍'
                },
                {
                  action: 'accept',
                  title: 'Accept ⚡'
                },
                {
                  action: 'decline',
                  title: 'Reject ❌'
                }
              ]
            : [
                {
                  action: 'open',
                  title: 'View Details 🔍'
                }
              ]
        };

        // Increase app notification badge count if API is supported
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(1).catch(e => console.log('Badge count set failed:', e));
        }

        return self.registration.showNotification(title, options);
      })
    );
  } catch (err) {
    console.error('Push notification processing failed:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  let targetUrl = event.notification.data?.url || '/dashboard';
  
  // Clear app notification badge count
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(e => console.log('Badge clear failed:', e));
  }

  // Handle Decline button action redirect
  if (action === 'decline') {
    targetUrl = `${targetUrl}&decline=true`;
  } else if (action === 'accept') {
    targetUrl = `${targetUrl}&accept=true`;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find matching client window
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin)) {
          matchingClient = client;
          break;
        }
      }
      
      if (matchingClient) {
        return matchingClient.navigate(targetUrl).then((c) => c.focus());
      } else if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
