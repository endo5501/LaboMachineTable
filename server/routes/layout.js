const express = require('express');
const { get, all, run } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/layout
 * @desc    Get all equipment layout
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const layout = await all('SELECT * FROM layout');
    res.json(layout);
  } catch (err) {
    console.error('Get layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/layout/equipment/:id
 * @desc    Get layout for specific equipment
 * @access  Private
 */
router.get('/equipment/:id', async (req, res) => {
  try {
    const layout = await get(
      'SELECT * FROM layout WHERE equipment_id = ?',
      [req.params.id]
    );
    
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found for this equipment' });
    }
    
    res.json(layout);
  } catch (err) {
    console.error('Get equipment layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/layout
 * @desc    Create or update multiple equipment layouts
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Request body must be an array of layout items' });
    }
    
    const results = [];
    
    for (const item of req.body) {
      const { equipment_id, x_position, y_position, width, height } = item;
      
      if (!equipment_id || x_position === undefined || y_position === undefined) {
        return res.status(400).json({ 
          message: 'Each layout item must have equipment_id, x_position, and y_position' 
        });
      }
      
      // Check if equipment exists
      const equipment = await get('SELECT id FROM equipment WHERE id = ?', [equipment_id]);
      
      if (!equipment) {
        return res.status(404).json({ message: `Equipment with ID ${equipment_id} not found` });
      }
      
      // Check if layout already exists for this equipment
      const existingLayout = await get(
        'SELECT id FROM layout WHERE equipment_id = ?',
        [equipment_id]
      );
      
      let result;
      
      if (existingLayout) {
        // Update existing layout
        result = await run(
          `UPDATE layout SET 
            x_position = ?, 
            y_position = ?, 
            width = ?, 
            height = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE equipment_id = ?`,
          [
            x_position, 
            y_position, 
            width || 150, 
            height || 100, 
            equipment_id
          ]
        );
        
        results.push({
          id: existingLayout.id,
          equipment_id,
          x_position,
          y_position,
          width: width || 150,
          height: height || 100,
          updated: true
        });
      } else {
        // Create new layout
        result = await run(
          `INSERT INTO layout 
            (equipment_id, x_position, y_position, width, height) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            equipment_id, 
            x_position, 
            y_position, 
            width || 150, 
            height || 100
          ]
        );
        
        results.push({
          id: result.id,
          equipment_id,
          x_position,
          y_position,
          width: width || 150,
          height: height || 100,
          created: true
        });
      }
    }
    
    res.status(201).json(results);
  } catch (err) {
    console.error('Create/update layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/layout/equipment/:id
 * @desc    Update layout for specific equipment
 * @access  Private
 */
router.put('/equipment/:id', async (req, res) => {
  try {
    const { x_position, y_position, width, height } = req.body;
    const equipment_id = req.params.id;
    
    if (x_position === undefined || y_position === undefined) {
      return res.status(400).json({ 
        message: 'x_position and y_position are required' 
      });
    }
    
    // Check if equipment exists
    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [equipment_id]);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Check if layout already exists for this equipment
    const existingLayout = await get(
      'SELECT id FROM layout WHERE equipment_id = ?',
      [equipment_id]
    );
    
    let result;
    
    if (existingLayout) {
      // Update existing layout
      result = await run(
        `UPDATE layout SET 
          x_position = ?, 
          y_position = ?, 
          width = ?, 
          height = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE equipment_id = ?`,
        [
          x_position, 
          y_position, 
          width || 150, 
          height || 100, 
          equipment_id
        ]
      );
      
      const updatedLayout = await get(
        'SELECT * FROM layout WHERE equipment_id = ?',
        [equipment_id]
      );
      
      res.json(updatedLayout);
    } else {
      // Create new layout
      result = await run(
        `INSERT INTO layout 
          (equipment_id, x_position, y_position, width, height) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          equipment_id, 
          x_position, 
          y_position, 
          width || 150, 
          height || 100
        ]
      );
      
      const newLayout = await get(
        'SELECT * FROM layout WHERE id = ?',
        [result.id]
      );
      
      res.status(201).json(newLayout);
    }
  } catch (err) {
    console.error('Update equipment layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/layout/equipment/:id
 * @desc    Delete layout for specific equipment
 * @access  Private
 */
router.delete('/equipment/:id', async (req, res) => {
  try {
    const equipment_id = req.params.id;
    
    // Check if layout exists for this equipment
    const layout = await get(
      'SELECT id FROM layout WHERE equipment_id = ?',
      [equipment_id]
    );
    
    if (!layout) {
      return res.status(404).json({ message: 'Layout not found for this equipment' });
    }
    
    // Delete layout
    await run('DELETE FROM layout WHERE equipment_id = ?', [equipment_id]);
    
    res.json({ message: 'Layout deleted' });
  } catch (err) {
    console.error('Delete equipment layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
