const { nanoid } = require("nanoid");

/**
 * Generate a URL-safe external ID
 * @param {number} size - Length of the ID (default: 12)
 * @returns {string} - Generated external ID
 */
const generateExternalId = (size = 12) => {
  return nanoid(size);
};

/**
 * Generate a prefixed external ID
 * @param {string} prefix - Prefix for the ID (e.g., 'pat', 'apt')
 * @param {number} size - Length of the random part (default: 10)
 * @returns {string} - Generated external ID with prefix
 */
const generatePrefixedExternalId = (prefix, size = 10) => {
  return `${prefix}_${nanoid(size)}`;
};

/**
 * Validate external ID format
 * @param {string} externalId - External ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
const isValidExternalId = (externalId) => {
  if (!externalId || typeof externalId !== "string") {
    return false;
  }

  // Check if it's a valid nanoid (URL-safe characters only)
  const nanoidRegex = /^[A-Za-z0-9_-]+$/;
  return nanoidRegex.test(externalId) && externalId.length >= 6;
};

module.exports = {
  generateExternalId,
  generatePrefixedExternalId,
  isValidExternalId,
};
