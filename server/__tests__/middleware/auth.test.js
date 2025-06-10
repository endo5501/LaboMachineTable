const { authenticate } = require('../../middleware/auth');
const { verifyToken, getTokenFromRequest } = require('../../utils/auth');
const { get } = require('../../utils/db');

// Mock dependencies
jest.mock('../../utils/auth');
jest.mock('../../utils/db');

describe('Auth Middleware', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('should authenticate valid token', async () => {
    const mockUser = {
      id: 1, username: 'testuser', name: 'Test User', email: 'test@example.com',
    };
    const mockDecoded = { userId: 1 };

    getTokenFromRequest.mockReturnValue('valid-token');
    verifyToken.mockReturnValue(mockDecoded);
    get.mockResolvedValue(mockUser);

    await authenticate(req, res, next);

    expect(getTokenFromRequest).toHaveBeenCalledWith(req);
    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(get).toHaveBeenCalledWith('SELECT id, username, name, email FROM users WHERE id = ?', [1]);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject request without token', async () => {
    getTokenFromRequest.mockReturnValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token', async () => {
    getTokenFromRequest.mockReturnValue('invalid-token');
    verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request when user not found', async () => {
    const mockDecoded = { userId: 999 };

    getTokenFromRequest.mockReturnValue('valid-token');
    verifyToken.mockReturnValue(mockDecoded);
    get.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle database errors', async () => {
    const mockDecoded = { userId: 1 };

    getTokenFromRequest.mockReturnValue('valid-token');
    verifyToken.mockReturnValue(mockDecoded);
    get.mockRejectedValue(new Error('Database error'));

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });
});
