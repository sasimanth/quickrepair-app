const admin = require('firebase-admin');

let messaging = null;
let isFirebaseInitialized = false;

// Check if variables are set
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  // Replace escaped newlines if any
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (projectId && clientEmail && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    messaging = admin.messaging();
    isFirebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn('⚠️ Firebase credentials not fully configured. Running FCM in mock/fallback mode.');
}

/**
 * Sends a background push notification via FCM
 * @param {object} params
 * @param {string} params.token - The FCM token for the device
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body
 * @param {object} [params.data] - Key-value metadata payloads
 * @param {string} [params.priority] - 'high' or 'normal'
 * @returns {Promise<boolean>}
 */
const sendFcmNotification = async ({ token, title, body, data = {}, priority = 'high' }) => {
  if (!token) {
    console.warn('⚠️ sendFcmNotification: No target token provided.');
    return false;
  }

  // Format data payload to ensure all values are strings (FCM requirement)
  const formattedData = {};
  if (data) {
    Object.keys(data).forEach(key => {
      formattedData[key] = String(data[key]);
    });
  }

  if (isFirebaseInitialized && messaging) {
    try {
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data: formattedData,
        android: {
          priority,
          notification: {
            sound: 'default',
            vibrateTimingsMillis: [0, 500, 100, 500],
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          headers: {
            Urgency: priority === 'high' ? 'high' : 'normal',
          },
          notification: {
            title,
            body,
            icon: '/logo192.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200],
            data: formattedData,
          },
        },
      };

      const response = await messaging.send(message);
      console.log('🔥 Successfully sent FCM notification message ID:', response);
      return true;
    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      // If token is invalid or unregistered, mark it as inactive
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-argument') {
        try {
          const FcmToken = require('../models/FcmToken');
          await FcmToken.updateMany({ token }, { isActive: false });
          console.log(`扫 Marked invalid FCM token as inactive: ${token}`);
        } catch (dbErr) {
          console.error('Failed to mark invalid token as inactive in database:', dbErr);
        }
      }
      return false;
    }
  } else {
    // Mock Mode
    console.log(`[FCM MOCK SEND]
      To Token: ${token}
      Title: ${title}
      Body: ${body}
      Data: ${JSON.stringify(formattedData)}
      Priority: ${priority}
    `);
    return true;
  }
};

module.exports = {
  sendFcmNotification,
  isFirebaseInitialized
};
