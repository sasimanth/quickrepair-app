// backend/middleware/rawBody.js
// Safely capture the raw request body for webhook signature verification.
// Enforces a 1 MB size limit and returns 413 if exceeded.
const MAX_RAW_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

function rawBody(req, res, next) {
  let received = 0;
  const chunks = [];
  req.on('data', chunk => {
    received += chunk.length;
    if (received > MAX_RAW_BODY_SIZE) {
      // Abort with Payload Too Large
      res.status(413).json({ success: false, message: 'Payload too large' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (res.headersSent) return; // already responded due to size limit
    req.rawBody = Buffer.concat(chunks);
    next();
  });
}

module.exports = rawBody;
