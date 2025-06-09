const request = require('supertest');
const app = require('../../app');
const { hashPassword } = require('../../utils/auth');
const { run, get, all } = require('../../utils/db');

// Mock database functions for integration tests
jest.mock('../../utils/db');

describe('API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup test user
    testUser = {
      id: 1,
      username: 'testuser',
      password: await hashPassword('testpass'),
      name: 'Test User',
      email: 'test@example.com'
    };

    // Mock successful login
    get.mockImplementation((query, params) => {
      if (query.includes('SELECT * FROM users WHERE username = ?')) {
        return Promise.resolve(testUser);
      }
      return Promise.resolve(null);
    });

    // Mock password comparison (we'll mock this to always return true for tests)
    jest.doMock('../../utils/auth', () => ({
      ...jest.requireActual('../../utils/auth'),
      comparePassword: jest.fn().mockResolvedValue(true)
    }));

    process.env.JWT_SECRET = 'test-secret';
    process.env.ENABLE_AUTO_REGISTRATION = 'true';

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });

    authToken = loginResponse.body.token;
  });

  describe('Authentication Flow', () => {
    test('should complete full authentication cycle', async () => {
      // Test login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.username).toBe('testuser');

      // Test accessing protected route
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(meResponse.status).toBe(200);
    });
  });

  describe('Equipment Management Flow', () => {
    beforeEach(() => {
      // Mock equipment data
      const mockEquipment = [
        { id: 1, name: 'Microscope', type: 'Optical', description: 'High-resolution microscope', active: 1 },
        { id: 2, name: 'Centrifuge', type: 'Mechanical', description: 'High-speed centrifuge', active: 1 }
      ];

      all.mockImplementation((query) => {
        if (query.includes('SELECT * FROM equipment')) {
          return Promise.resolve(mockEquipment);
        }
        return Promise.resolve([]);
      });

      get.mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM users WHERE username = ?')) {
          return Promise.resolve(testUser);
        }
        if (query.includes('SELECT * FROM equipment WHERE id = ?')) {
          const id = parseInt(params[0]);
          return Promise.resolve(mockEquipment.find(eq => eq.id === id) || null);
        }
        return Promise.resolve(null);
      });

      run.mockResolvedValue({ id: 3 });
    });

    test('should handle complete equipment CRUD operations', async () => {
      // Get all equipment
      const getResponse = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body)).toBe(true);

      // Create new equipment
      const newEquipment = {
        name: 'New Instrument',
        type: 'Electronic',
        description: 'New test instrument'
      };

      get.mockResolvedValueOnce({
        id: 3,
        ...newEquipment,
        active: 1
      });

      const createResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEquipment);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe(newEquipment.name);

      // Update equipment
      const updateData = {
        name: 'Updated Instrument',
        type: 'Digital',
        description: 'Updated description'
      };

      get.mockResolvedValueOnce({ id: 1 }); // Equipment exists
      get.mockResolvedValueOnce({
        id: 1,
        ...updateData,
        active: 1
      });

      const updateResponse = await request(app)
        .put('/api/equipment/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe(updateData.name);

      // Delete equipment
      get.mockResolvedValueOnce({ id: 1 }); // Equipment exists

      const deleteResponse = await request(app)
        .delete('/api/equipment/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Equipment deleted');
    });
  });

  describe('Reservation Management Flow', () => {
    beforeEach(() => {
      const mockReservations = [
        {
          id: 1,
          equipment_id: 1,
          user_id: 1,
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T11:00:00Z',
          status: 'active'
        }
      ];

      all.mockImplementation((query) => {
        if (query.includes('SELECT * FROM reservations')) {
          return Promise.resolve(mockReservations);
        }
        return Promise.resolve([]);
      });

      run.mockResolvedValue({ id: 2 });
    });

    test('should handle reservation creation and retrieval', async () => {
      // Get all reservations
      const getResponse = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body)).toBe(true);

      // Create new reservation
      const newReservation = {
        equipment_id: 1,
        start_time: '2024-01-01T14:00:00Z',
        end_time: '2024-01-01T15:00:00Z'
      };

      get.mockResolvedValueOnce({
        id: 2,
        ...newReservation,
        user_id: 1,
        status: 'active'
      });

      const createResponse = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newReservation);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.equipment_id).toBe(newReservation.equipment_id);
    });
  });

  describe('Layout Management Flow', () => {
    beforeEach(() => {
      const mockLayout = [
        {
          id: 1,
          equipment_id: 1,
          x_position: 100,
          y_position: 200,
          width: 150,
          height: 100
        }
      ];

      const mockTextLabels = [
        {
          id: 1,
          content: 'Test Label',
          x_position: 50,
          y_position: 50,
          font_size: 16
        }
      ];

      all.mockImplementation((query) => {
        if (query.includes('SELECT * FROM layout')) {
          return Promise.resolve(mockLayout);
        }
        if (query.includes('SELECT * FROM text_labels')) {
          return Promise.resolve(mockTextLabels);
        }
        return Promise.resolve([]);
      });

      get.mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM users WHERE username = ?')) {
          return Promise.resolve(testUser);
        }
        if (query.includes('SELECT * FROM layout WHERE equipment_id = ?')) {
          return Promise.resolve(mockLayout[0]);
        }
        if (query.includes('SELECT * FROM text_labels WHERE id = ?')) {
          return Promise.resolve(mockTextLabels[0]);
        }
        return Promise.resolve(null);
      });

      run.mockResolvedValue({ id: 2 });
    });

    test('should handle layout and text label operations', async () => {
      // Get layout
      const layoutResponse = await request(app)
        .get('/api/layout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(layoutResponse.status).toBe(200);
      expect(Array.isArray(layoutResponse.body)).toBe(true);

      // Get text labels
      const labelsResponse = await request(app)
        .get('/api/layout/labels')
        .set('Authorization', `Bearer ${authToken}`);

      expect(labelsResponse.status).toBe(200);
      expect(Array.isArray(labelsResponse.body)).toBe(true);

      // Update equipment position
      const updateData = {
        x_position: 150,
        y_position: 250,
        width: 200,
        height: 120
      };

      get.mockResolvedValueOnce({
        id: 1,
        equipment_id: 1,
        ...updateData
      });

      const updateResponse = await request(app)
        .put('/api/layout/equipment/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.x_position).toBe(updateData.x_position);

      // Create text label
      const newLabel = {
        content: 'New Label',
        x_position: 100,
        y_position: 100,
        font_size: 14
      };

      get.mockResolvedValueOnce({
        id: 2,
        ...newLabel
      });

      const labelResponse = await request(app)
        .post('/api/layout/labels')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLabel);

      expect(labelResponse.status).toBe(201);
      expect(labelResponse.body.content).toBe(newLabel.content);
    });
  });

  describe('Error Handling', () => {
    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/equipment');

      expect(response.status).toBe(401);
    });

    test('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
    });

    test('should handle database errors gracefully', async () => {
      all.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });
});