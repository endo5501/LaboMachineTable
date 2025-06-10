const express = require('express');
const { get, all, run } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/reservations
 * @desc    Get all reservations
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const reservations = await all(`
      SELECT 
        r.*,
        u.username as user_username,
        e.name as equipment_name
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN equipment e ON r.equipment_id = e.id
      ORDER BY r.start_time ASC
    `);

    res.json(reservations);
  } catch (err) {
    console.error('Get reservations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reservations/:id
 * @desc    Get reservation by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const reservation = await get(`
      SELECT 
        r.*,
        u.username as user_username,
        e.name as equipment_name
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (err) {
    console.error('Get reservation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reservations/equipment/:id
 * @desc    Get reservations for specific equipment
 * @access  Private
 */
router.get('/equipment/:id', async (req, res) => {
  try {
    const reservations = await all(`
      SELECT 
        r.*,
        u.username as user_username
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.equipment_id = ?
      ORDER BY r.start_time ASC
    `, [req.params.id]);

    res.json(reservations);
  } catch (err) {
    console.error('Get equipment reservations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reservations/user/:id
 * @desc    Get reservations for specific user
 * @access  Private
 */
router.get('/user/:id', async (req, res) => {
  try {
    const reservations = await all(`
      SELECT 
        r.*,
        e.name as equipment_name
      FROM reservations r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.start_time ASC
    `, [req.params.id]);

    res.json(reservations);
  } catch (err) {
    console.error('Get user reservations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/reservations
 * @desc    Create a new reservation
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { equipment_id, start_time, end_time } = req.body;
    const user_id = req.user.id;

    if (!equipment_id || !start_time || !end_time) {
      return res.status(400).json({
        message: 'Equipment ID, start time, and end time are required',
      });
    }

    // Check if equipment exists
    const equipment = await get('SELECT id FROM equipment WHERE id = ?', [equipment_id]);

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Check for conflicts
    const conflicts = await all(`
      SELECT id FROM reservations 
      WHERE equipment_id = ? 
      AND status = 'active'
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `, [
      equipment_id,
      end_time, start_time,
      end_time, start_time,
      start_time, end_time,
    ]);

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Reservation conflicts with existing reservations' });
    }

    // Create reservation
    const result = await run(
      'INSERT INTO reservations (equipment_id, user_id, start_time, end_time) VALUES (?, ?, ?, ?)',
      [equipment_id, user_id, start_time, end_time],
    );

    // Get created reservation
    const reservation = await get(`
      SELECT 
        r.*,
        u.username as user_username,
        e.name as equipment_name
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `, [result.id]);

    res.status(201).json(reservation);
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/reservations/:id
 * @desc    Update a reservation
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { start_time, end_time, status } = req.body;
    const user_id = req.user.id;

    // Check if reservation exists
    const reservation = await get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if user owns the reservation or is an admin
    if (reservation.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to update this reservation' });
    }

    // Build update query
    let updateQuery = 'UPDATE reservations SET ';
    const updateParams = [];
    const updateFields = [];

    if (start_time) {
      updateFields.push('start_time = ?');
      updateParams.push(start_time);
    }

    if (end_time) {
      updateFields.push('end_time = ?');
      updateParams.push(end_time);
    }

    if (status) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateQuery += updateFields.join(', ');
    updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    updateParams.push(req.params.id);

    // If changing times, check for conflicts
    if (start_time || end_time) {
      const newStartTime = start_time || reservation.start_time;
      const newEndTime = end_time || reservation.end_time;

      const conflicts = await all(`
        SELECT id FROM reservations 
        WHERE equipment_id = ? 
        AND id != ?
        AND status = 'active'
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `, [
        reservation.equipment_id,
        reservation.id,
        newEndTime, newStartTime,
        newEndTime, newStartTime,
        newStartTime, newEndTime,
      ]);

      if (conflicts.length > 0) {
        return res.status(409).json({ message: 'Reservation conflicts with existing reservations' });
      }
    }

    // Update reservation
    await run(updateQuery, updateParams);

    // Get updated reservation
    const updatedReservation = await get(`
      SELECT 
        r.*,
        u.username as user_username,
        e.name as equipment_name
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `, [req.params.id]);

    res.json(updatedReservation);
  } catch (err) {
    console.error('Update reservation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/reservations/:id
 * @desc    Delete a reservation
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const user_id = req.user.id;

    // Check if reservation exists
    const reservation = await get('SELECT * FROM reservations WHERE id = ?', [req.params.id]);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if user owns the reservation or is an admin
    if (reservation.user_id !== user_id) {
      return res.status(403).json({ message: 'Not authorized to delete this reservation' });
    }

    // Delete reservation
    await run('DELETE FROM reservations WHERE id = ?', [req.params.id]);

    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    console.error('Delete reservation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
