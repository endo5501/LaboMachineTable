const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { hashPassword, comparePassword, generateToken } = require('../../utils/auth');
const { get, run } = require('../../utils/db');

// Mock dependencies
jest.mock('../../utils/auth');
jest.mock('../../utils/db');
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    // Mock authenticate middleware
    req.user = { id: 1, username: 'testuser', name: 'Test User' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_AUTO_REGISTRATION = 'true';
  });

  describe('POST /api/auth/login', () => {
    test('should login existing user with correct credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockToken = 'mock-jwt-token';

      get.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue(mockToken);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: mockToken,
        user: {
          id: 1,
          username: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      expect(get).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', ['testuser']);
      expect(comparePassword).toHaveBeenCalledWith('testpass', 'hashedpassword');
      expect(generateToken).toHaveBeenCalledWith({ userId: 1 });
    });

    test('should reject login with wrong password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
      };

      get.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpass',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should create new user when auto-registration is enabled', async () => {
      const mockToken = 'mock-jwt-token';
      const mockNewUser = {
        id: 2,
        username: 'newuser',
        password: 'hashedpassword',
        name: null,
        email: null,
      };

      get.mockResolvedValueOnce(null); // User doesn't exist
      get.mockResolvedValueOnce(mockNewUser); // Return new user after creation
      hashPassword.mockResolvedValue('hashedpassword');
      run.mockResolvedValue({ id: 2 });
      generateToken.mockReturnValue(mockToken);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'newuser',
          password: 'newpass',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        token: mockToken,
        user: {
          id: 2,
          username: 'newuser',
          name: null,
          email: null,
        },
      });

      expect(hashPassword).toHaveBeenCalledWith('newpass');
      expect(run).toHaveBeenCalledWith(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        ['newuser', 'hashedpassword'],
      );
    });

    test('should reject new user when auto-registration is disabled', async () => {
      process.env.ENABLE_AUTO_REGISTRATION = 'false';

      get.mockResolvedValue(null); // User doesn't exist

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'newuser',
          password: 'newpass',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
      expect(hashPassword).not.toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
    });

    test('should return 400 for missing username or password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password are required');
    });

    test('should return 500 for server errors', async () => {
      get.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass',
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        username: 'testuser',
        name: 'Test User',
      });
    });
  });
});
