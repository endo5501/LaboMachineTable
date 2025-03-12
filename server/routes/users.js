const express = require('express');
const { hashPassword } = require('../utils/auth');
const { get, all, run } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const users = await all('SELECT id, username, name, email FROM users');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await get(
      'SELECT id, username, name, email FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingUser = await get('SELECT id FROM users WHERE username = ?', [username]);
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const result = await run(
      'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, name || null, email || null]
    );
    
    // Get created user
    const user = await get(
      'SELECT id, username, name, email FROM users WHERE id = ?',
      [result.id]
    );
    
    res.status(201).json(user);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    
    // Check if user exists
    const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If username is provided, check if it's already taken by another user
    if (username) {
      const existingUser = await get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.params.id]
      );
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Build update query
    let updateQuery = 'UPDATE users SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (username) {
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    
    if (password) {
      updateFields.push('password = ?');
      updateParams.push(await hashPassword(password));
    }
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(name || null);
    }
    
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email || null);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateQuery += updateFields.join(', ');
    updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    updateParams.push(req.params.id);
    
    // Update user
    await run(updateQuery, updateParams);
    
    // Get updated user
    const updatedUser = await get(
      'SELECT id, username, name, email FROM users WHERE id = ?',
      [req.params.id]
    );
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if user exists
    const user = await get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Delete user
    await run('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
