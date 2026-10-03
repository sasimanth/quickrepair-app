// middleware/requestId.js
const { v4: uuidv4 } = require('uuid');
/**
 * Assign a unique request ID to each incoming request.
 * The ID is attached to req.id and added as response header X-Request-Id.
 */
function requestId(req, res, next) {
  const id = uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
module.exports = requestId;
