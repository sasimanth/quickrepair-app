const axios = require('axios');

// Send SMS via Fast2SMS / MSG91 / Twilio or fallback log
const sendSmsOtp = async (phone, otp) => {
  try {
    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    const smsApiKey = process.env.FAST2SMS_API_KEY || process.env.MSG91_API_KEY;

    console.log(`\n======================================================`);
    console.log(`📱 [SMS OTP DISPATCH] Phone: ${cleanPhone} | OTP Code: ${otp}`);
    console.log(`======================================================\n`);

    if (smsApiKey && process.env.FAST2SMS_API_KEY) {
      // Fast2SMS API integration for Indian numbers
      await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          variables_values: otp,
          route: 'otp',
          numbers: cleanPhone
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY
          }
        }
      );
      console.log(`✅ [FAST2SMS] SMS OTP successfully dispatched to ${cleanPhone}`);
    }

    return { success: true, phone: cleanPhone };
  } catch (error) {
    console.error('SMS Dispatch Error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSmsOtp };
