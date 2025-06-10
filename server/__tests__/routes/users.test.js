const request = require('supertest');
const express = require('express');
const usersRouter = require('../../routes/users');
const { get, all, run } = require('../../utils/db');
const { hashPassword } = require('../../utils/auth');

jest.mock('../../utils/db');
jest.mock('../../utils/auth');
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    test('should return all users without passwords', async () => {
      const mockUsers = [
        {
          id: 1, username: 'user1', name: 'User One', email: 'user1@test.com',
        },
        {
          id: 2, username: 'user2', name: 'User Two', email: 'user2@test.com',
        },
      ];

      all.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(all).toHaveBeenCalledWith('SELECT id, username, name, email FROM users');
    });

    test('should handle database errors', async () => {
      all.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/users')
        .expect(500)
        .expect({ message: 'Server error' });
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return specific user without password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@test.com',
      };

      get.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(get).toHaveBeenCalledWith(
        'SELECT id, username, name, email FROM users WHERE id = ?',
        ['1'],
      );
    });

    test('should return 404 for non-existent user', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .get('/api/users/999')
        .expect(404)
        .expect({ message: 'User not found' });
    });
  });

  describe('POST /api/users', () => {
    test('should create new user successfully', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@test.com',
      };

      const mockCreatedUser = {
        id: 2,
        username: 'newuser',
        name: 'New User',
        email: 'new@test.com',
      };

      get.mockResolvedValueOnce(null); // No existing user
      hashPassword.mockResolvedValue('hashed_password');
      run.mockResolvedValue({ id: 2 });
      get.mockResolvedValueOnce(mockCreatedUser);

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedUser);
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(run).toHaveBeenCalledWith(
        'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
        ['newuser', 'hashed_password', 'New User', 'new@test.com'],
      );
    });

    test('should return 400 for missing username or password', async () => {
      await request(app)
        .post('/api/users')
        .send({ username: 'testuser' })
        .expect(400)
        .expect({ message: 'Username and password are required' });
    });

    test('should return 400 for existing username', async () => {
      const userData = {
        username: 'existinguser',
        password: 'password123',
      };

      get.mockResolvedValue({ id: 1 }); // Existing user

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400)
        .expect({ message: 'Username already exists' });
    });

    test('should handle null name and email', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
      };

      const mockCreatedUser = {
        id: 2,
        username: 'newuser',
        name: null,
        email: null,
      };

      get.mockResolvedValueOnce(null);
      hashPassword.mockResolvedValue('hashed_password');
      run.mockResolvedValue({ id: 2 });
      get.mockResolvedValueOnce(mockCreatedUser);

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedUser);
      expect(run).toHaveBeenCalledWith(
        'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
        ['newuser', 'hashed_password', null, null],
      );
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user successfully', async () => {
      const updateData = {
        username: 'updateduser',
        name: 'Updated Name',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'updateduser',
        name: 'Updated Name',
        email: 'test@test.com',
      };

      get.mockResolvedValueOnce({ id: 1 }); // User exists
      get.mockResolvedValueOnce(null); // Username not taken
      run.mockResolvedValue();
      get.mockResolvedValueOnce(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedUser);
    });

    test('should return 404 for non-existent user', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .put('/api/users/999')
        .send({ username: 'newname' })
        .expect(404)
        .expect({ message: 'User not found' });
    });

    test('should return 400 for existing username', async () => {
      const updateData = { username: 'existinguser' };

      get.mockResolvedValueOnce({ id: 1 }); // User exists
      get.mockResolvedValueOnce({ id: 2 }); // Username taken by another user

      await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(400)
        .expect({ message: 'Username already exists' });
    });

    test('should return 400 for no update fields', async () => {
      get.mockResolvedValue({ id: 1 });

      await request(app)
        .put('/api/users/1')
        .send({})
        .expect(400)
        .expect({ message: 'No fields to update' });
    });

    test('should hash password when updating', async () => {
      const updateData = { password: 'newpassword' };

      get.mockResolvedValueOnce({ id: 1 });
      hashPassword.mockResolvedValue('hashed_new_password');
      run.mockResolvedValue();
      get.mockResolvedValueOnce({ id: 1, username: 'testuser' });

      await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(hashPassword).toHaveBeenCalledWith('newpassword');
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user successfully', async () => {
      get.mockResolvedValue({ id: 2 }); // User exists and not self
      run.mockResolvedValue();

      await request(app)
        .delete('/api/users/2')
        .expect(200)
        .expect({ message: 'User deleted' });

      expect(run).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', ['2']);
    });

    test('should return 404 for non-existent user', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .delete('/api/users/999')
        .expect(404)
        .expect({ message: 'User not found' });
    });

    test('should prevent deleting own account', async () => {
      get.mockResolvedValue({ id: 1 }); // Same as authenticated user

      await request(app)
        .delete('/api/users/1')
        .expect(400)
        .expect({ message: 'Cannot delete your own account' });
    });
  });
});
