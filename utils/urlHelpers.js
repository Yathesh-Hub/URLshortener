const validator = require('validator');

/**
 * Generate a random alphanumeric short code of specified length
 * @param {number} length 
 * @returns {string}
 */
function generateCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Normalize and validate input URL string
 * @param {string} urlInput 
 * @returns {string|null}
 */
function normalizeUrl(urlInput) {
  if (!urlInput || typeof urlInput !== 'string') return null;
  let trimmed = urlInput.trim();
  if (!trimmed) return null;

  // Add http:// if missing protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'http://' + trimmed;
  }

  // Validate URL structure using validator library
  if (!validator.isURL(trimmed, { require_protocol: true, require_valid_protocol: true })) {
    return null;
  }

  return trimmed;
}

module.exports = {
  generateCode,
  normalizeUrl
};
