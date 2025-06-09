const request = require('supertest');
const express = require('express');
const reservationsRouter = require('../../routes/reservations');
const { get, all, run } = require('../../utils/db');

jest.mock('../../utils/db');
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/reservations', reservationsRouter);

describe('Reservations Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reservations', () => {
    test('should return all reservations with user and equipment details', async () => {
      const mockReservations = [
        {
          id: 1,
          equipment_id: 1,
          user_id: 1,
          start_time: '2023-01-01 10:00:00',
          end_time: '2023-01-01 12:00:00',
          status: 'active',
          user_username: 'testuser',
          equipment_name: 'Test Equipment'
        }
      ];

      all.mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/api/reservations')
        .expect(200);

      expect(response.body).toEqual(mockReservations);
      expect(all).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    test('should handle database errors', async () => {
      all.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/reservations')
        .expect(500)
        .expect({ message: 'Server error' });
    });
  });

  describe('GET /api/reservations/:id', () => {
    test('should return specific reservation', async () => {
      const mockReservation = {
        id: 1,
        equipment_id: 1,
        user_id: 1,
        start_time: '2023-01-01 10:00:00',
        end_time: '2023-01-01 12:00:00',
        status: 'active',
        user_username: 'testuser',
        equipment_name: 'Test Equipment'
      };

      get.mockResolvedValue(mockReservation);

      const response = await request(app)
        .get('/api/reservations/1')
        .expect(200);

      expect(response.body).toEqual(mockReservation);
      expect(get).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['1']);
    });

    test('should return 404 for non-existent reservation', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .get('/api/reservations/999')
        .expect(404)
        .expect({ message: 'Reservation not found' });
    });
  });

  describe('GET /api/reservations/equipment/:id', () => {
    test('should return reservations for specific equipment', async () => {
      const mockReservations = [
        {
          id: 1,
          equipment_id: 1,
          user_id: 1,
          start_time: '2023-01-01 10:00:00',
          end_time: '2023-01-01 12:00:00',
          status: 'active',
          user_username: 'testuser'
        }
      ];

      all.mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/api/reservations/equipment/1')
        .expect(200);

      expect(response.body).toEqual(mockReservations);
      expect(all).toHaveBeenCalledWith(expect.stringContaining('WHERE r.equipment_id = ?'), ['1']);
    });
  });

  describe('GET /api/reservations/user/:id', () => {
    test('should return reservations for specific user', async () => {
      const mockReservations = [
        {
          id: 1,
          equipment_id: 1,
          user_id: 1,
          start_time: '2023-01-01 10:00:00',
          end_time: '2023-01-01 12:00:00',
          status: 'active',
          equipment_name: 'Test Equipment'
        }
      ];

      all.mockResolvedValue(mockReservations);

      const response = await request(app)
        .get('/api/reservations/user/1')
        .expect(200);

      expect(response.body).toEqual(mockReservations);
      expect(all).toHaveBeenCalledWith(expect.stringContaining('WHERE r.user_id = ?'), ['1']);
    });
  });

  describe('POST /api/reservations', () => {
    test('should create new reservation successfully', async () => {
      const reservationData = {
        equipment_id: 1,
        start_time: '2023-01-01 10:00:00',
        end_time: '2023-01-01 12:00:00'
      };

      const mockEquipment = { id: 1 };
      const mockCreatedReservation = {
        id: 1,
        ...reservationData,
        user_id: 1,
        status: 'active',
        user_username: 'testuser',
        equipment_name: 'Test Equipment'
      };

      get.mockResolvedValueOnce(mockEquipment);
      all.mockResolvedValue([]);
      run.mockResolvedValue({ id: 1 });
      get.mockResolvedValueOnce(mockCreatedReservation);

      const response = await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedReservation);
    });

    test('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/reservations')
        .send({ equipment_id: 1 })
        .expect(400)
        .expect({ message: 'Equipment ID, start time, and end time are required' });
    });

    test('should return 404 for non-existent equipment', async () => {
      const reservationData = {
        equipment_id: 999,
        start_time: '2023-01-01 10:00:00',
        end_time: '2023-01-01 12:00:00'
      };

      get.mockResolvedValue(null);

      await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(404)
        .expect({ message: 'Equipment not found' });
    });

    test('should return 409 for conflicting reservations', async () => {
      const reservationData = {
        equipment_id: 1,
        start_time: '2023-01-01 10:00:00',
        end_time: '2023-01-01 12:00:00'
      };

      const mockEquipment = { id: 1 };
      const mockConflicts = [{ id: 2 }];

      get.mockResolvedValue(mockEquipment);
      all.mockResolvedValue(mockConflicts);

      await request(app)
        .post('/api/reservations')
        .send(reservationData)
        .expect(409)
        .expect({ message: 'Reservation conflicts with existing reservations' });
    });
  });

  describe('PUT /api/reservations/:id', () => {
    test('should update reservation successfully', async () => {
      const updateData = {
        start_time: '2023-01-01 11:00:00',
        end_time: '2023-01-01 13:00:00'
      };

      const mockReservation = {
        id: 1,
        equipment_id: 1,
        user_id: 1,
        start_time: '2023-01-01 10:00:00',
        end_time: '2023-01-01 12:00:00',
        status: 'active'
      };

      const mockUpdatedReservation = {
        ...mockReservation,
        ...updateData,
        user_username: 'testuser',
        equipment_name: 'Test Equipment'
      };

      get.mockResolvedValueOnce(mockReservation);
      all.mockResolvedValue([]);
      run.mockResolvedValue();
      get.mockResolvedValueOnce(mockUpdatedReservation);

      const response = await request(app)
        .put('/api/reservations/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedReservation);
    });

    test('should return 404 for non-existent reservation', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .put('/api/reservations/999')
        .send({ start_time: '2023-01-01 11:00:00' })
        .expect(404)
        .expect({ message: 'Reservation not found' });
    });

    test('should return 403 for unauthorized update', async () => {
      const mockReservation = {
        id: 1,
        user_id: 2,
        equipment_id: 1
      };

      get.mockResolvedValue(mockReservation);

      await request(app)
        .put('/api/reservations/1')
        .send({ start_time: '2023-01-01 11:00:00' })
        .expect(403)
        .expect({ message: 'Not authorized to update this reservation' });
    });

    test('should return 400 for no update fields', async () => {
      const mockReservation = {
        id: 1,
        user_id: 1,
        equipment_id: 1
      };

      get.mockResolvedValue(mockReservation);

      await request(app)
        .put('/api/reservations/1')
        .send({})
        .expect(400)
        .expect({ message: 'No fields to update' });
    });
  });

  describe('DELETE /api/reservations/:id', () => {
    test('should delete reservation successfully', async () => {
      const mockReservation = {
        id: 1,
        user_id: 1,
        equipment_id: 1
      };

      get.mockResolvedValue(mockReservation);
      run.mockResolvedValue();

      await request(app)
        .delete('/api/reservations/1')
        .expect(200)
        .expect({ message: 'Reservation deleted' });

      expect(run).toHaveBeenCalledWith('DELETE FROM reservations WHERE id = ?', ['1']);
    });

    test('should return 404 for non-existent reservation', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .delete('/api/reservations/999')
        .expect(404)
        .expect({ message: 'Reservation not found' });
    });

    test('should return 403 for unauthorized deletion', async () => {
      const mockReservation = {
        id: 1,
        user_id: 2,
        equipment_id: 1
      };

      get.mockResolvedValue(mockReservation);

      await request(app)
        .delete('/api/reservations/1')
        .expect(403)
        .expect({ message: 'Not authorized to delete this reservation' });
    });
  });
});