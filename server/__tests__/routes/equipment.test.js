const request = require('supertest');
const express = require('express');
const equipmentRoutes = require('../../routes/equipment');
const { get, all, run } = require('../../utils/db');

// Mock dependencies
jest.mock('../../utils/db');
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/equipment', equipmentRoutes);

describe('Equipment Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/equipment', () => {
    test('should return all equipment', async () => {
      const mockEquipment = [
        { id: 1, name: 'Equipment 1', type: 'Type A', description: 'Description 1', active: 1 },
        { id: 2, name: 'Equipment 2', type: 'Type B', description: 'Description 2', active: 1 }
      ];

      all.mockResolvedValue(mockEquipment);

      const response = await request(app).get('/api/equipment');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEquipment);
      expect(all).toHaveBeenCalledWith('SELECT * FROM equipment');
    });

    test('should handle database errors', async () => {
      all.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/equipment');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /api/equipment/:id', () => {
    test('should return specific equipment by id', async () => {
      const mockEquipment = {
        id: 1,
        name: 'Equipment 1',
        type: 'Type A',
        description: 'Description 1',
        active: 1
      };

      get.mockResolvedValue(mockEquipment);

      const response = await request(app).get('/api/equipment/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEquipment);
      expect(get).toHaveBeenCalledWith('SELECT * FROM equipment WHERE id = ?', ['1']);
    });

    test('should return 404 for non-existing equipment', async () => {
      get.mockResolvedValue(null);

      const response = await request(app).get('/api/equipment/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Equipment not found');
    });
  });

  describe('POST /api/equipment', () => {
    test('should create new equipment', async () => {
      const newEquipment = {
        name: 'New Equipment',
        type: 'New Type',
        description: 'New Description'
      };

      const mockResult = { id: 3 };
      const mockCreatedEquipment = {
        id: 3,
        ...newEquipment,
        active: 1
      };

      run.mockResolvedValue(mockResult);
      get.mockResolvedValue(mockCreatedEquipment);

      const response = await request(app)
        .post('/api/equipment')
        .send(newEquipment);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCreatedEquipment);
      expect(run).toHaveBeenCalledWith(
        'INSERT INTO equipment (name, type, description, active) VALUES (?, ?, ?, ?)',
        ['New Equipment', 'New Type', 'New Description', 1]
      );
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .send({
          type: 'New Type'
          // missing name
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Equipment name is required');
    });
  });

  describe('PUT /api/equipment/:id', () => {
    test('should update existing equipment', async () => {
      const updateData = {
        name: 'Updated Equipment',
        type: 'Updated Type',
        description: 'Updated Description'
      };

      const mockUpdatedEquipment = {
        id: 1,
        ...updateData,
        active: 1
      };

      get.mockResolvedValueOnce({ id: 1 }); // Equipment exists
      run.mockResolvedValue({});
      get.mockResolvedValueOnce(mockUpdatedEquipment); // Return updated equipment

      const response = await request(app)
        .put('/api/equipment/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedEquipment);
      expect(run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE equipment SET'),
        expect.arrayContaining(['Updated Equipment', 'Updated Type', 'Updated Description', '1'])
      );
    });

    test('should return 404 for non-existing equipment', async () => {
      get.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/equipment/999')
        .send({
          name: 'Updated Equipment'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Equipment not found');
    });
  });

  describe('DELETE /api/equipment/:id', () => {
    test('should soft delete equipment', async () => {
      get.mockResolvedValue({ id: 1 }); // Equipment exists
      run.mockResolvedValue({});

      const response = await request(app).delete('/api/equipment/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Equipment deleted');
      expect(run).toHaveBeenCalledWith(
        'DELETE FROM equipment WHERE id = ?',
        ['1']
      );
    });

    test('should return 404 for non-existing equipment', async () => {
      get.mockResolvedValue(null);

      const response = await request(app).delete('/api/equipment/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Equipment not found');
    });
  });
});