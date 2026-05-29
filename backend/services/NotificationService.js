const Notification = require('../models/Notification');
const webpush = require('web-push');
const { getVapidKeys } = require('../utils/vapidHelper');

// Configure Web Push VAPID keys
try {
  const keys = getVapidKeys();
  webpush.setVapidDetails(
    'mailto:support@fixvo.com',
    keys.publicKey,
    keys.privateKey
  );
} catch (e) {
  console.error('Error initializing web-push VAPID details:', e);
}

// Actual external service dispatcher via Resend API
const dispatchExternal = async (email, phone, type, subject, message) => {
  console.log(`\n================================`);
  console.log(`📤 [EXTERNAL DISPATCH INITIATED] 📤`);
  
  // Simulated or Live SMS using Twilio
  if (type === 'sms' || type === 'both') {
    const phoneNum = phone || '+15550000000'; // Needs to be an E.164 number (+1234567890)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      console.log(`🚀 Dispatching LIVE SMS via Twilio to: ${phoneNum}`);
      try {
        const encodedAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const bodyParams = new URLSearchParams({
          To: phoneNum,
          From: twilioFrom,
          Body: `${subject} - ${message}`
        });

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${encodedAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams.toString()
        });
        
        const result = await response.json();
        if (response.ok) {
          console.log(`✅ Twilio Native Dispatch Success! SID: ${result.sid}`);
        } else {
          console.error(`❌ Twilio Error:`, result);
        }
      } catch (err) {
        console.error('Failed to dispatch via Twilio:', err.message);
      }
    } else {
      console.log(`📱 MOCK SMS TO: ${phoneNum}`);
      console.log(`💬 TEXT: ${subject} - ${message}`);
      console.log(`\n💡 To enable LIVE REAL SMS, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file!`);
    }
  }

  // Real or Simulated Email using Resend
  if (type === 'email' || type === 'both') {
    const resendApiKey = process.env.RESEND_API_KEY;
    const targetEmail = email || 'customer@fixvo.com';
    
    if (resendApiKey) {
      console.log(`🚀 Dispatching LIVE Email via Resend to: ${targetEmail}`);
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Fixvo <onboarding@resend.dev>',
            to: [targetEmail],
            subject: subject,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                     <h2 style="color: #4f46e5;">Fixvo Notification</h2>
                     <p style="font-size: 16px; color: #333;">${message}</p>
                     <p style="font-size: 14px; color: #666; margin-top: 20px;">Open your dashboard to view details.</p>
                   </div>`
          })
        });
        
        const result = await response.json();
        if (response.ok) {
          console.log(`✅ Resend Native Dispatch Success! ID: ${result.id}`);
        } else {
          console.error(`❌ Resend Error:`, result);
        }
      } catch (err) {
        console.error('Failed to dispatch via Resend:', err.message);
      }
    } else {
      console.log(`📧 MOCK EMAIL TO: ${targetEmail}`);
      console.log(`📝 SUBJECT: ${subject}`);
      console.log(`💌 BODY: ${message}`);
      console.log(`\n💡 To enable LIVE REAL emails, set RESEND_API_KEY in your .env file!`);
    }
  }
  console.log(`================================\n`);
};

// Internal In-App Push Method
const sendInAppPush = async (userId, title, message, type = 'system', bookingId = null) => {
  try {
    await Notification.create({ userId, title, message, type, bookingId });
  } catch (err) {
    console.error('Failed saving push to DB:', err.message);
  }
};

// Background Web Push Dispatcher
const sendWebPush = async (userId, title, message, bookingId = null) => {
  try {
    const PushSubscription = require('../models/PushSubscription');
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body: message,
      data: {
        url: bookingId ? `/dashboard?jobId=${bookingId}` : '/dashboard',
        bookingId
      }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`❌ Removing invalid push subscription for user ${userId}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`Error sending push notification:`, err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('Failed to send web push:', err.message);
  }
};

/**
 * Main dispatcher to handle Email + SMS + In-App Push instantly.
 */
const notifyUser = async ({ userId, email, phone, type = 'email', subject, text, notifType = 'system', bookingId = null }) => {
  // Fire In-App DB Notification & Web Push
  if (userId) {
    await sendInAppPush(userId, subject, text, notifType, bookingId);
    await sendWebPush(userId, subject, text, bookingId);
  }

  // Simulate remote external (Twilio / SendGrid)
  if (email || phone) {
    await dispatchExternal(email, phone, type, subject, text);
  }
};

module.exports = { notifyUser };
