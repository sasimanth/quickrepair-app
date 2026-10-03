// backend/middleware/rawWhatsAppBody.js
// Captures the raw request body for WhatsApp webhook HMAC-SHA256 signature verification.
// Must be mounted BEFORE express.json() on the /api/whatsapp/webhook route.
// Mirrors the pattern used in rawBody.js for Razorpay.

const MAX_WA_BODY_SIZE = 512 * 1024; // 512 KB — Meta webhook payloads are small

function rawWhatsAppBody(req, res, next) {
  let received = 0;
  const chunks = [];

  req.on('data', (chunk) => {
    received += chunk.length;
    if (received > MAX_WA_BODY_SIZE) {
      res.status(413).json({ success: false, message: 'WhatsApp webhook payload too large' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (res.headersSent) return;
    req.rawBody = Buffer.concat(chunks);
    next();
  });

  req.on('error', (err) => {
    console.error('[WhatsApp rawBody] Stream error:', err.message);
    if (!res.headersSent) {
      res.status(400).json({ success: false, message: 'Bad request stream' });
    }
  });
}

module.exports = rawWhatsAppBody;
