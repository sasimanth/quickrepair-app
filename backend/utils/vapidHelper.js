const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const getVapidKeys = () => {
  const configPath = path.join(__dirname, '../config/vapid.json');
  const configDir = path.dirname(configPath);

  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // First check env
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  }

  // Then check config file
  if (fs.existsSync(configPath)) {
    try {
      const keys = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (keys.publicKey && keys.privateKey) {
        return keys;
      }
    } catch (e) {
      console.error('Error reading VAPID config, generating new ones...', e);
    }
  }

  // Fallback: Generate new keys and save
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(configPath, JSON.stringify(keys, null, 2), 'utf8');
  console.log('⚡ Dynamic VAPID keys successfully generated and saved to config/vapid.json');
  return keys;
};

module.exports = { getVapidKeys };
