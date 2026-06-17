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
    const createdNotif = await Notification.create({ userId, title, message, type, bookingId });
    if (global.io) {
      global.io.to(`user_${userId}`).emit('new_notification', createdNotif.toObject());
      console.log(`📡 Emitted new_notification socket event to user_${userId}`);
    }
  } catch (err) {
    console.error('Failed saving push to DB:', err.message);
  }
};

// Background Web Push Dispatcher
const sendWebPush = async (userId, title, message, bookingId = null, priority = null) => {
  try {
    const PushSubscription = require('../models/PushSubscription');
    const DeviceSession = require('../models/DeviceSession');

    // Find active push subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId, isActive: true });
    if (!subscriptions || subscriptions.length === 0) return;

    // Fetch the recipient's role dynamically to set the correct dashboard url
    const User = require('../models/User');
    const recipientUser = await User.findById(userId);
    const role = recipientUser ? recipientUser.role : 'user';

    // Suppression logic: If recipient is a technician, only notify if they are online/available
    if (role === 'technician') {
      const Technician = require('../models/Technician');
      const techProfile = await Technician.findOne({ userId });
      if (!techProfile || !techProfile.isOnline || techProfile.currentStatus === 'offline') {
        console.log(`⚠️ Skipping push notification for technician user ${userId} because technician profile is offline/inactive`);
        return;
      }
    }

    const redirectUrl = role === 'technician'
      ? (bookingId ? `/technician-dashboard?jobId=${bookingId}` : '/technician-dashboard')
      : (bookingId ? `/dashboard?jobId=${bookingId}` : '/dashboard');

    // Determine priority
    let finalPriority = priority;
    if (!finalPriority) {
      const lowerTitle = (title || '').toLowerCase();
      const lowerMsg = (message || '').toLowerCase();
      if (
        lowerTitle.includes('new') || 
        lowerTitle.includes('assigned') || 
        lowerTitle.includes('payment') || 
        lowerTitle.includes('payout') || 
        lowerTitle.includes('timeout') || 
        lowerTitle.includes('declined') ||
        lowerTitle.includes('rejected') ||
        lowerMsg.includes('new') ||
        lowerMsg.includes('assigned') ||
        lowerMsg.includes('urgent')
      ) {
        finalPriority = 'high';
      } else {
        finalPriority = 'low';
      }
    }

    let finalTitle = title;
    let finalBody = message;

    if (bookingId) {
      try {
        const Booking = require('../models/Booking');
        const booking = await Booking.findById(bookingId);
        if (booking) {
          finalTitle = `New Request: ${booking.serviceName || title} 💼`;
          finalBody = `🏡 Area: ${booking.location || 'Madanapalle'}\n👤 Name: ${booking.name || 'Client'}\n🛠️ Issue: ${booking.problemDescription || 'Not specified'}`;
        }
      } catch (err) {
        console.error('Error fetching booking details for push:', err.message);
      }
    }

    const payload = JSON.stringify({
      title: finalTitle,
      body: finalBody,
      data: {
        url: redirectUrl,
        bookingId,
        priority: finalPriority
      }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Only skip if the session is explicitly marked inactive
        const session = await DeviceSession.findOne({ userId, deviceId: sub.deviceId });
        if (session && session.isActive === false) {
          console.log(`⚠️ Skipping push notification for user ${userId} on device ${sub.deviceId} because device session is explicitly inactive`);
          return;
        }

        const subObject = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        };

        await webpush.sendNotification(subObject, payload);

        // Update timestamps on successful push delivery
        sub.lastSeen = new Date();
        await sub.save();
        session.lastSeen = new Date();
        await session.save();
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404 || err.message.includes('expired') || err.message.includes('permission')) {
          console.log(`❌ Removing invalid push subscription for user ${userId} on device ${sub.deviceId}`);
          await PushSubscription.deleteOne({ _id: sub._id });
          await DeviceSession.updateMany({ userId, deviceId: sub.deviceId }, { $set: { isActive: false } });
        } else {
          console.error(`Error sending push notification to user ${userId} on device ${sub.deviceId}:`, err.message);
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
const notifyUser = async ({ userId, email, phone, type = 'email', subject, text, notifType = 'system', bookingId = null, priority = null }) => {
  // Fire In-App DB Notification & Web Push
  if (userId) {
    await sendInAppPush(userId, subject, text, notifType, bookingId);
    await sendWebPush(userId, subject, text, bookingId, priority);
  }

  // Simulate remote external (Twilio / SendGrid)
  if (email || phone) {
    await dispatchExternal(email, phone, type, subject, text);
  }
};

module.exports = { notifyUser };
