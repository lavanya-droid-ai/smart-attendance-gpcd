const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { TOKEN_TYPES } = require('../config/constants');

/**
 * Generates a signed BLE broadcast token.
 * This token is broadcast by the teacher's device and received by student devices
 * in proximity to verify physical presence.
 */
const generateBLEToken = (sessionId, classId) => {
  const payload = {
    type: TOKEN_TYPES.BLE,
    sid: sessionId.toString(),
    cid: classId.toString(),
    nonce: crypto.randomBytes(8).toString('hex'),
    iat: Math.floor(Date.now() / 1000),
  };

  const expiresIn = parseInt(process.env.BLE_TOKEN_EXPIRY, 10) || 3600;

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generates a signed NFC token.
 * This token is encoded on the teacher's NFC tag and students tap their device
 * against it to record attendance.
 */
const generateNFCToken = (sessionId, classId) => {
  const payload = {
    type: TOKEN_TYPES.NFC,
    sid: sessionId.toString(),
    cid: classId.toString(),
    nonce: crypto.randomBytes(8).toString('hex'),
    iat: Math.floor(Date.now() / 1000),
  };

  const expiresIn = parseInt(process.env.NFC_TOKEN_EXPIRY, 10) || 3600;

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Validates a BLE or NFC token and returns the decoded payload.
 * Returns null if the token is invalid or expired.
 */
const validateAttendanceToken = (token, expectedType) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== expectedType) {
      return { valid: false, error: 'Token type mismatch' };
    }

    return {
      valid: true,
      sessionId: decoded.sid,
      classId: decoded.cid,
      type: decoded.type,
      issuedAt: decoded.iat,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token has expired' };
    }
    return { valid: false, error: 'Invalid token' };
  }
};

/**
 * Generates a unique session identifier using a combination
 * of timestamp, random bytes, and a prefix.
 */
const generateSessionToken = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(12).toString('hex');
  return `SES-${timestamp}-${randomPart}`;
};

/**
 * Generates a cryptographically secure random string.
 */
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  generateBLEToken,
  generateNFCToken,
  validateAttendanceToken,
  generateSessionToken,
  generateSecureRandom,
};
