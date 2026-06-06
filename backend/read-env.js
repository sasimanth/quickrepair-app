const fs = require('fs');
const path = require('path');

try {
  const frontEnvPath = path.join(__dirname, '../frontend/.env');
  if (fs.existsSync(frontEnvPath)) {
    console.log('--- frontend/.env ---');
    console.log(fs.readFileSync(frontEnvPath, 'utf8'));
  } else {
    console.log('frontend/.env does not exist');
  }

  const backEnvPath = path.join(__dirname, '.env');
  if (fs.existsSync(backEnvPath)) {
    console.log('--- backend/.env ---');
    // Hide passwords/URIs
    const content = fs.readFileSync(backEnvPath, 'utf8');
    const masked = content.replace(/(PASSWORD|URI|SECRET|KEY|TOKEN|PASS)=[^\n]+/gi, '$1=***');
    console.log(masked);
  } else {
    console.log('backend/.env does not exist');
  }
} catch (err) {
  console.error(err);
}
