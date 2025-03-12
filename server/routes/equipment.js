const express = require('express');
const { get, all, run } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/equipment
 * @desc    Get all equipment
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const equipment = await all('SELECT * FROM equipment');
    res.json(equipment);
  } catch (err) {
    console.error('Get equipment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/equipment/:id
 * @desc    Get equipment by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const equipment = await get(
      'SELECT * FROM equipment WHERE id = ?',
      [req.params.id]
    );
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json(equipment);
  } catch (err) {
    console.error('Get equipment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/equipment
 * @desc    Create a new equipment
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, description, active } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Equipment name is required' });
    }
    
    // Create equipment
    const result = await run(
      'INSERT INTO equipment (name, type, description, active) VALUES (?, ?, ?, ?)',
      [name, type || null, description || null, active === false ? 0 : 1]
    );
    
    // Get created equipment
    const equipment = await get(
      'SELECT * FROM equipment WHERE id = ?',
      [result.id]
    );
    
    res.status(201).json(equipment);
  } catch (err) {
    console.error('Create equipment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/equipment/:id
 * @desc    Update an equipment
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description, active } = req.body;
    
    // Check if equipment exists
    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [req.params.id]);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Build update query
    let updateQuery = 'UPDATE equipment SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }
    
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateParams.push(type || null);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description || null);
    }
    
    if (active !== undefined) {
      updateFields.push('active = ?');
      updateParams.push(active ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateQuery += updateFields.join(', ');
    updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    updateParams.push(req.params.id);
    
    // Update equipment
    await run(updateQuery, updateParams);
    
    // Get updated equipment
    const updatedEquipment = await get(
      'SELECT * FROM equipment WHERE id = ?',
      [req.params.id]
    );
    
    res.json(updatedEquipment);
  } catch (err) {
    console.error('Update equipment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Delete an equipment
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check if equipment exists
    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [req.params.id]);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Delete equipment
    await run('DELETE FROM equipment WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Equipment deleted' });
  } catch (err) {
    console.error('Delete equipment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
