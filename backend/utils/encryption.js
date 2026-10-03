/**
 * AES-256-GCM Encryption Utility for KYC Sensitive Fields
 * 
 * Used to encrypt bank account numbers, IFSC codes, and other PII
 * before storing in MongoDB. Compliant with IT Act 2000 Section 43A
 * and DPDPA 2023 requirements for "reasonable security practices."
 * 
 * Key Management:
 * - KYC_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)
 * - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * - Store securely in environment variables, never commit to source
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;     // 128 bits
const TAG_LENGTH = 16;    // 128 bits
const ENCODING = 'hex';

/**
 * Get the encryption key from environment variables.
 * Falls back to a development-only default (logs a warning).
 */
const getEncryptionKey = () => {
  const keyHex = process.env.KYC_ENCRYPTION_KEY;

  if (!keyHex || keyHex.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: KYC_ENCRYPTION_KEY is missing or invalid. ' +
        'Must be a 64-character hex string (32 bytes). ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    // Development fallback — deterministic key for local testing only
    console.warn(
      '⚠️  KYC_ENCRYPTION_KEY not set — using insecure development fallback. ' +
      'DO NOT use in production.'
    );
    return Buffer.from('0'.repeat(64), 'hex');
  }

  return Buffer.from(keyHex, 'hex');
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * 
 * @param {string} plaintext - The value to encrypt
 * @returns {string} Encrypted payload as "iv:tag:ciphertext" hex string
 * @throws {Error} If plaintext is empty or encryption fails
 */
const encrypt = (plaintext) => {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('encrypt() requires a non-empty string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const tag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex-encoded)
  return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
};

/**
 * Decrypt an AES-256-GCM encrypted payload.
 * 
 * @param {string} encryptedPayload - "iv:tag:ciphertext" hex string
 * @returns {string} Decrypted plaintext
 * @throws {Error} If payload format is invalid, key is wrong, or data is tampered
 */
const decrypt = (encryptedPayload) => {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new Error('decrypt() requires a non-empty string');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected "iv:tag:ciphertext".');
  }

  const [ivHex, tagHex, ciphertext] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, ENCODING);
  const tag = Buffer.from(tagHex, ENCODING);

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${TAG_LENGTH}, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Check if a string looks like an encrypted payload.
 * 
 * @param {string} value - The value to check
 * @returns {boolean} True if the value matches the encrypted format
 */
const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  // Check all parts are valid hex
  return parts.every(part => /^[0-9a-f]+$/i.test(part));
};

/**
 * Mask a bank account number for display purposes.
 * Shows only the last 4 digits: "XXXX XXXX 5678"
 * 
 * @param {string} accountNumber - Full account number (plaintext)
 * @returns {string} Masked account number
 */
const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || typeof accountNumber !== 'string') return 'XXXX XXXX XXXX';
  const clean = accountNumber.replace(/\s/g, '');
  if (clean.length <= 4) return `XXXX ${clean}`;
  const lastFour = clean.slice(-4);
  return `XXXX XXXX ${lastFour}`;
};

/**
 * Mask an IFSC code for display purposes.
 * Shows first 4 characters and last 2: "HDFC****34"
 * 
 * @param {string} ifscCode - Full IFSC code
 * @returns {string} Masked IFSC code
 */
const maskIfscCode = (ifscCode) => {
  if (!ifscCode || typeof ifscCode !== 'string') return 'XXXX****XX';
  if (ifscCode.length <= 6) return ifscCode;
  return `${ifscCode.slice(0, 4)}****${ifscCode.slice(-2)}`;
};

/**
 * Hash a file's content for deduplication and integrity checking.
 * 
 * @param {string} content - File content (base64 string or raw data)
 * @returns {string} SHA-256 hash hex string
 */
const hashDocument = (content) => {
  if (!content) return '';
  return crypto.createHash('sha256').update(content).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  maskAccountNumber,
  maskIfscCode,
  hashDocument
};
