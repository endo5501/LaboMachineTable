const express = require('express');
const { get, all, run } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/layout/pages
 * @desc    Get all layout pages
 * @access  Private
 */
router.get('/pages', async (req, res) => {
  try {
    const pages = await all('SELECT * FROM layout_pages ORDER BY id');
    res.json(pages);
  } catch (err) {
    console.error('Get layout pages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/layout/pages
 * @desc    Create a new layout page
 * @access  Private
 */
router.post('/pages', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Page name is required' });
    }

    const result = await run(
      'INSERT INTO layout_pages (name) VALUES (?)',
      [name],
    );

    const newPage = await get(
      'SELECT * FROM layout_pages WHERE id = ?',
      [result.id],
    );

    res.status(201).json(newPage);
  } catch (err) {
    console.error('Create layout page error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/layout/pages/:id
 * @desc    Update a layout page name
 * @access  Private
 */
router.put('/pages/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const pageId = req.params.id;

    if (!name) {
      return res.status(400).json({ message: 'Page name is required' });
    }

    // Check if page exists
    const page = await get('SELECT id FROM layout_pages WHERE id = ?', [pageId]);
    if (!page) {
      return res.status(404).json({ message: 'Layout page not found' });
    }

    await run(
      'UPDATE layout_pages SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, pageId],
    );

    const updatedPage = await get(
      'SELECT * FROM layout_pages WHERE id = ?',
      [pageId],
    );

    res.json(updatedPage);
  } catch (err) {
    console.error('Update layout page error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/layout/pages/:id
 * @desc    Delete a layout page
 * @access  Private
 */
router.delete('/pages/:id', async (req, res) => {
  try {
    const pageId = req.params.id;

    // Prevent deleting the default page
    if (pageId === '1') {
      return res.status(400).json({ message: 'Cannot delete the default page' });
    }

    // Check if page exists
    const page = await get('SELECT id FROM layout_pages WHERE id = ?', [pageId]);
    if (!page) {
      return res.status(404).json({ message: 'Layout page not found' });
    }

    await run('DELETE FROM layout_pages WHERE id = ?', [pageId]);

    res.json({ message: 'Layout page deleted' });
  } catch (err) {
    console.error('Delete layout page error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/layout
 * @desc    Get all equipment layout (optionally filtered by page)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { pageId } = req.query;

    let query = 'SELECT * FROM layout';
    let params = [];

    if (pageId) {
      query += ' WHERE page_id = ?';
      params = [pageId];
    }

    const layout = await all(query, params);
    res.json(layout);
  } catch (err) {
    console.error('Get layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/layout/equipment/:id
 * @desc    Get layout for specific equipment (optionally filtered by page)
 * @access  Private
 */
router.get('/equipment/:id', async (req, res) => {
  try {
    const { pageId } = req.query;

    let query = 'SELECT * FROM layout WHERE equipment_id = ?';
    const params = [req.params.id];

    if (pageId) {
      query += ' AND page_id = ?';
      params.push(pageId);
    }

    const layout = await get(query, params);

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
      const {
        equipment_id, x_position, y_position, width, height, page_id = 1,
      } = item;

      if (!equipment_id || x_position === undefined || y_position === undefined) {
        return res.status(400).json({
          message: 'Each layout item must have equipment_id, x_position, and y_position',
        });
      }

      // Check if equipment exists
      const equipment = await get('SELECT id FROM equipment WHERE id = ?', [equipment_id]);

      if (!equipment) {
        return res.status(404).json({ message: `Equipment with ID ${equipment_id} not found` });
      }

      // Check if page exists
      const page = await get('SELECT id FROM layout_pages WHERE id = ?', [page_id]);
      if (!page) {
        return res.status(404).json({ message: `Layout page with ID ${page_id} not found` });
      }

      // Check if layout already exists for this equipment on this page
      const existingLayout = await get(
        'SELECT id FROM layout WHERE equipment_id = ? AND page_id = ?',
        [equipment_id, page_id],
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
          WHERE equipment_id = ? AND page_id = ?`,
          [
            x_position,
            y_position,
            width || 150,
            height || 100,
            equipment_id,
            page_id,
          ],
        );

        results.push({
          id: existingLayout.id,
          page_id,
          equipment_id,
          x_position,
          y_position,
          width: width || 150,
          height: height || 100,
          updated: true,
        });
      } else {
        // Create new layout
        result = await run(
          `INSERT INTO layout 
            (page_id, equipment_id, x_position, y_position, width, height) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            page_id,
            equipment_id,
            x_position,
            y_position,
            width || 150,
            height || 100,
          ],
        );

        results.push({
          id: result.id,
          page_id,
          equipment_id,
          x_position,
          y_position,
          width: width || 150,
          height: height || 100,
          created: true,
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
    const {
      x_position, y_position, width, height, page_id = 1,
    } = req.body;
    const equipment_id = req.params.id;

    if (x_position === undefined || y_position === undefined) {
      return res.status(400).json({
        message: 'x_position and y_position are required',
      });
    }

    // Check if equipment exists
    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [equipment_id]);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check if page exists
    const page = await get('SELECT id FROM layout_pages WHERE id = ?', [page_id]);
    if (!page) {
      return res.status(404).json({ message: `Layout page with ID ${page_id} not found` });
    }

    // Check if layout already exists for this equipment on this page
    const existingLayout = await get(
      'SELECT id FROM layout WHERE equipment_id = ? AND page_id = ?',
      [equipment_id, page_id],
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
        WHERE equipment_id = ? AND page_id = ?`,
        [
          x_position,
          y_position,
          width || 150,
          height || 100,
          equipment_id,
          page_id,
        ],
      );

      const updatedLayout = await get(
        'SELECT * FROM layout WHERE equipment_id = ? AND page_id = ?',
        [equipment_id, page_id],
      );

      res.json(updatedLayout);
    } else {
      // Create new layout
      result = await run(
        `INSERT INTO layout 
          (page_id, equipment_id, x_position, y_position, width, height) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          page_id,
          equipment_id,
          x_position,
          y_position,
          width || 150,
          height || 100,
        ],
      );

      const newLayout = await get(
        'SELECT * FROM layout WHERE id = ?',
        [result.id],
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
    const { pageId } = req.query;

    if (pageId) {
      // Delete layout for specific equipment on specific page
      const layout = await get(
        'SELECT id FROM layout WHERE equipment_id = ? AND page_id = ?',
        [equipment_id, pageId],
      );

      if (!layout) {
        return res.status(404).json({ message: 'Layout not found for this equipment on this page' });
      }

      await run('DELETE FROM layout WHERE equipment_id = ? AND page_id = ?', [equipment_id, pageId]);
    } else {
      // Delete all layouts for this equipment across all pages
      const layout = await get(
        'SELECT id FROM layout WHERE equipment_id = ?',
        [equipment_id],
      );

      if (!layout) {
        return res.status(404).json({ message: 'Layout not found for this equipment' });
      }

      await run('DELETE FROM layout WHERE equipment_id = ?', [equipment_id]);
    }

    res.json({ message: 'Layout deleted' });
  } catch (err) {
    console.error('Delete equipment layout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/layout/labels
 * @desc    Get all text labels (optionally filtered by page)
 * @access  Private
 */
router.get('/labels', async (req, res) => {
  try {
    const { pageId } = req.query;

    let query = 'SELECT * FROM text_labels';
    let params = [];

    if (pageId) {
      query += ' WHERE page_id = ?';
      params = [pageId];
    }

    const labels = await all(query, params);
    res.json(labels);
  } catch (err) {
    console.error('Get text labels error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/layout/labels/:id
 * @desc    Get text label by ID
 * @access  Private
 */
router.get('/labels/:id', async (req, res) => {
  try {
    const label = await get(
      'SELECT * FROM text_labels WHERE id = ?',
      [req.params.id],
    );

    if (!label) {
      return res.status(404).json({ message: 'Text label not found' });
    }

    res.json(label);
  } catch (err) {
    console.error('Get text label error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/layout/labels
 * @desc    Create a new text label
 * @access  Private
 */
router.post('/labels', async (req, res) => {
  try {
    const {
      content, x_position, y_position, font_size, page_id = 1,
    } = req.body;

    if (!content || x_position === undefined || y_position === undefined) {
      return res.status(400).json({
        message: 'Content, x_position, and y_position are required',
      });
    }

    // Check if page exists
    const page = await get('SELECT id FROM layout_pages WHERE id = ?', [page_id]);
    if (!page) {
      return res.status(404).json({ message: `Layout page with ID ${page_id} not found` });
    }

    const result = await run(
      `INSERT INTO text_labels 
        (page_id, content, x_position, y_position, font_size) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        page_id,
        content,
        x_position,
        y_position,
        font_size || 16,
      ],
    );

    const newLabel = await get(
      'SELECT * FROM text_labels WHERE id = ?',
      [result.id],
    );

    res.status(201).json(newLabel);
  } catch (err) {
    console.error('Create text label error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/layout/labels/:id
 * @desc    Update a text label
 * @access  Private
 */
router.put('/labels/:id', async (req, res) => {
  try {
    const {
      content, x_position, y_position, font_size,
    } = req.body;
    const { id } = req.params;

    // Check if label exists
    const label = await get('SELECT id FROM text_labels WHERE id = ?', [id]);

    if (!label) {
      return res.status(404).json({ message: 'Text label not found' });
    }

    // Build update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }

    if (x_position !== undefined) {
      updateFields.push('x_position = ?');
      updateValues.push(x_position);
    }

    if (y_position !== undefined) {
      updateFields.push('y_position = ?');
      updateValues.push(y_position);
    }

    if (font_size !== undefined) {
      updateFields.push('font_size = ?');
      updateValues.push(font_size);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Add ID to values array
    updateValues.push(id);

    // Update label
    await run(
      `UPDATE text_labels SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues,
    );

    const updatedLabel = await get(
      'SELECT * FROM text_labels WHERE id = ?',
      [id],
    );

    res.json(updatedLabel);
  } catch (err) {
    console.error('Update text label error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/layout/labels/:id
 * @desc    Delete a text label
 * @access  Private
 */
router.delete('/labels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if label exists
    const label = await get('SELECT id FROM text_labels WHERE id = ?', [id]);

    if (!label) {
      return res.status(404).json({ message: 'Text label not found' });
    }

    // Delete label
    await run('DELETE FROM text_labels WHERE id = ?', [id]);

    res.json({ message: 'Text label deleted' });
  } catch (err) {
    console.error('Delete text label error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
