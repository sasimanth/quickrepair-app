/**
 * Input Validators for KYC Data
 * 
 * Validates IFSC codes, bank account numbers, document formats,
 * and other KYC-related inputs before they reach the database.
 */

/**
 * Validate an Indian IFSC code format.
 * Format: 4 uppercase letters + '0' + 6 alphanumeric characters
 * Example: HDFC0001234, SBIN0012345
 * 
 * @param {string} ifsc - IFSC code to validate
 * @returns {{ valid: boolean, message?: string }}
 */
const validateIfscCode = (ifsc) => {
  if (!ifsc || typeof ifsc !== 'string') {
    return { valid: false, message: 'IFSC code is required.' };
  }

  const trimmed = ifsc.trim().toUpperCase();
  
  if (trimmed.length !== 11) {
    return { valid: false, message: 'IFSC code must be exactly 11 characters.' };
  }

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(trimmed)) {
    return { valid: false, message: 'Invalid IFSC format. Must be 4 letters + 0 + 6 alphanumeric characters (e.g., HDFC0001234).' };
  }

  return { valid: true };
};

/**
 * Validate an Indian bank account number.
 * Must be 9-18 digits (varies by bank).
 * 
 * @param {string} accountNumber - Account number to validate
 * @returns {{ valid: boolean, message?: string }}
 */
const validateAccountNumber = (accountNumber) => {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return { valid: false, message: 'Account number is required.' };
  }

  const trimmed = accountNumber.trim();
  
  // Must be numeric only
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, message: 'Account number must contain only digits.' };
  }

  if (trimmed.length < 9 || trimmed.length > 18) {
    return { valid: false, message: 'Account number must be 9-18 digits long.' };
  }

  // Check for obviously invalid patterns (all same digits)
  if (/^(\d)\1+$/.test(trimmed)) {
    return { valid: false, message: 'Account number appears invalid.' };
  }

  return { valid: true };
};

/**
 * Validate an account holder name.
 * 
 * @param {string} name - Account holder name
 * @returns {{ valid: boolean, message?: string }}
 */
const validateAccountName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Account holder name is required.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, message: 'Account holder name must be at least 2 characters.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'Account holder name is too long.' };
  }

  // Allow letters, spaces, dots, and hyphens (for Indian names)
  if (!/^[a-zA-Z\s.\-']+$/.test(trimmed)) {
    return { valid: false, message: 'Account holder name contains invalid characters.' };
  }

  return { valid: true };
};

/**
 * Validate a base64-encoded document file.
 * Checks MIME type, magic bytes, and file size.
 * 
 * @param {string} base64String - The base64 data URL string
 * @param {Object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 5)
 * @param {string[]} options.allowedMimes - Allowed MIME types
 * @returns {{ valid: boolean, message?: string, mimeType?: string, isUrl?: boolean }}
 */
const validateDocumentFile = (base64String, options = {}) => {
  const {
    maxSizeMB = 5,
    allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  } = options;

  if (!base64String) {
    return { valid: false, message: 'File is required.' };
  }

  // If it's already a URL (e.g., from seeded data or Cloudinary)
  if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return { valid: true, isUrl: true };
  }

  // Parse base64 data URL
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,(.+)$/);
  if (!matches) {
    return { valid: false, message: 'Invalid file format. Must be a valid Base64 data URL.' };
  }

  const mimeType = matches[1];
  const base64Content = matches[2];

  // Check MIME type
  if (!allowedMimes.includes(mimeType.toLowerCase())) {
    return { valid: false, message: `Invalid file type: ${mimeType}. Allowed: ${allowedMimes.join(', ')}.` };
  }

  // Check file size (estimate from base64 length)
  const estimatedSize = (base64Content.length * 3) / 4;
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (estimatedSize > maxBytes) {
    return { valid: false, message: `File size exceeds maximum limit of ${maxSizeMB}MB.` };
  }

  // Verify magic bytes to prevent MIME spoofing
  try {
    const buffer = Buffer.from(base64Content.substring(0, 32), 'base64');
    let isMagicValid = false;

    if (mimeType.includes('png')) {
      isMagicValid = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      isMagicValid = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    } else if (mimeType.includes('pdf')) {
      isMagicValid = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }

    if (!isMagicValid) {
      return { valid: false, message: 'File content does not match its declared MIME type. Possible spoofing detected.' };
    }
  } catch (err) {
    return { valid: false, message: 'Failed to verify file integrity.' };
  }

  return { valid: true, mimeType, isUrl: false };
};

/**
 * Sanitize a text input to prevent XSS and injection.
 * 
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
const sanitizeText = (input, maxLength = 500) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>"'`]/g, ''); // Strip HTML/script-dangerous chars
};

module.exports = {
  validateIfscCode,
  validateAccountNumber,
  validateAccountName,
  validateDocumentFile,
  sanitizeText
};
