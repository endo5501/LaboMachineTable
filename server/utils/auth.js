const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT secret key (required environment variable)
const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = '24h';

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches hash
 */
const comparePassword = async (password, hash) => await bcrypt.compare(password, hash);

/**
 * Generate a JWT token
 * @param {Object} payload - Token payload
 * @returns {string} - JWT token
 */
const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid token');
  }
};

/**
 * Extract token from request
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null
 */
const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getTokenFromRequest,
};
