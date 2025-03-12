const express = require('express');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { get, run } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check if user exists
    let user = await get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (user) {
      // User exists, verify password
      const isMatch = await comparePassword(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // User doesn't exist, create new user
      const hashedPassword = await hashPassword(password);
      
      const result = await run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
      );
      
      user = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    }
    
    // Generate JWT token
    const token = generateToken({ userId: user.id });
    
    // Return user info and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
