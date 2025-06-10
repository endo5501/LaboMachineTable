const { verifyToken, getTokenFromRequest } = require('../utils/auth');
const { get } = require('../utils/db');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await get('SELECT id, username, name, email FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request object
    req.user = user;

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authenticate,
};
