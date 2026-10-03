import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

let watchId = null;
let lastEmitTimestamp = 0;
const THROTTLE_MS = 5000; // Emit max once per 5 seconds

/**
 * Starts continuous location watching for active technician booking
 * @param {object} params
 * @param {string} params.bookingId
 * @param {string} params.techId
 * @param {object} params.socket - Socket.io client instance
 */
export const startTechnicianTracking = async ({ bookingId, techId, socket }) => {
  if (!bookingId || !techId || !socket) {
    console.warn('startTechnicianTracking missing required parameters');
    return;
  }

  // Stop existing watch if running
  stopTechnicianTracking();

  console.log(`🚀 Starting live GPS tracking stream for Booking #${bookingId}`);

  const handlePosition = (lat, lng, speed, heading) => {
    const now = Date.now();
    if (now - lastEmitTimestamp < THROTTLE_MS) {
      return; // Skip throttled emission
    }
    lastEmitTimestamp = now;

    socket.emit('update_booking_location', {
      bookingId,
      techId,
      lat,
      lng,
      speed: speed || 0,
      heading: heading || 0
    });
  };

  try {
    if (Capacitor.isNativePlatform()) {
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        await Geolocation.requestPermissions();
      }

      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000
        },
        (position, err) => {
          if (err || !position || !position.coords) {
            console.warn('Native GPS watch error:', err);
            return;
          }
          const { latitude, longitude, speed, heading } = position.coords;
          handlePosition(latitude, longitude, speed, heading);
        }
      );
    } else {
      // Browser Geolocation API
      if (!navigator.geolocation) {
        console.warn('Browser geolocation not supported');
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed, heading } = position.coords;
          handlePosition(latitude, longitude, speed, heading);
        },
        (err) => {
          console.warn('Browser GPS watch error:', err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000
        }
      );
    }
  } catch (error) {
    console.error('Failed to start technician location watcher:', error);
  }
};

/**
 * Stops continuous location watching
 */
export const stopTechnicianTracking = () => {
  if (watchId !== null) {
    try {
      if (Capacitor.isNativePlatform()) {
        Geolocation.clearWatch({ id: watchId });
      } else if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      console.log('🛑 Live GPS tracking stream stopped.');
    } catch (e) {
      console.warn('Error clearing location watch:', e.message);
    }
    watchId = null;
  }
};
