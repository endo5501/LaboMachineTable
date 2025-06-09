const request = require('supertest');
const express = require('express');
const layoutRouter = require('../../routes/layout');
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
app.use('/api/layout', layoutRouter);

describe('Layout Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/layout', () => {
    test('should return all layout data', async () => {
      const mockLayout = [
        { id: 1, equipment_id: 1, x_position: 100, y_position: 200, width: 150, height: 100 },
        { id: 2, equipment_id: 2, x_position: 300, y_position: 400, width: 150, height: 100 }
      ];

      all.mockResolvedValue(mockLayout);

      const response = await request(app)
        .get('/api/layout')
        .expect(200);

      expect(response.body).toEqual(mockLayout);
      expect(all).toHaveBeenCalledWith('SELECT * FROM layout');
    });

    test('should handle database errors', async () => {
      all.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/layout')
        .expect(500)
        .expect({ message: 'Server error' });
    });
  });

  describe('GET /api/layout/equipment/:id', () => {
    test('should return layout for specific equipment', async () => {
      const mockLayout = {
        id: 1,
        equipment_id: 1,
        x_position: 100,
        y_position: 200,
        width: 150,
        height: 100
      };

      get.mockResolvedValue(mockLayout);

      const response = await request(app)
        .get('/api/layout/equipment/1')
        .expect(200);

      expect(response.body).toEqual(mockLayout);
      expect(get).toHaveBeenCalledWith(
        'SELECT * FROM layout WHERE equipment_id = ?',
        ['1']
      );
    });

    test('should return 404 for non-existent layout', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .get('/api/layout/equipment/999')
        .expect(404)
        .expect({ message: 'Layout not found for this equipment' });
    });
  });

  describe('POST /api/layout', () => {
    test('should create new layouts successfully', async () => {
      const layoutData = [
        { equipment_id: 1, x_position: 100, y_position: 200, width: 150, height: 100 },
        { equipment_id: 2, x_position: 300, y_position: 400 }
      ];

      get.mockResolvedValueOnce({ id: 1 }); // Equipment 1 exists
      get.mockResolvedValueOnce(null); // No existing layout for equipment 1
      run.mockResolvedValueOnce({ id: 1 });

      get.mockResolvedValueOnce({ id: 2 }); // Equipment 2 exists
      get.mockResolvedValueOnce(null); // No existing layout for equipment 2
      run.mockResolvedValueOnce({ id: 2 });

      const response = await request(app)
        .post('/api/layout')
        .send(layoutData)
        .expect(201);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        equipment_id: 1,
        x_position: 100,
        y_position: 200,
        width: 150,
        height: 100,
        created: true
      });
      expect(response.body[1]).toMatchObject({
        equipment_id: 2,
        x_position: 300,
        y_position: 400,
        width: 150,
        height: 100,
        created: true
      });
    });

    test('should update existing layouts', async () => {
      const layoutData = [
        { equipment_id: 1, x_position: 150, y_position: 250 }
      ];

      const existingLayout = { id: 1 };

      get.mockResolvedValueOnce({ id: 1 }); // Equipment exists
      get.mockResolvedValueOnce(existingLayout); // Existing layout
      run.mockResolvedValue();

      const response = await request(app)
        .post('/api/layout')
        .send(layoutData)
        .expect(201);

      expect(response.body[0]).toMatchObject({
        equipment_id: 1,
        x_position: 150,
        y_position: 250,
        updated: true
      });
    });

    test('should return 400 for invalid request body', async () => {
      await request(app)
        .post('/api/layout')
        .send('invalid')
        .expect(400)
        .expect({ message: 'Request body must be an array of layout items' });
    });

    test('should return 400 for missing required fields', async () => {
      const layoutData = [
        { equipment_id: 1, x_position: 100 } // Missing y_position
      ];

      await request(app)
        .post('/api/layout')
        .send(layoutData)
        .expect(400)
        .expect({ message: 'Each layout item must have equipment_id, x_position, and y_position' });
    });

    test('should return 404 for non-existent equipment', async () => {
      const layoutData = [
        { equipment_id: 999, x_position: 100, y_position: 200 }
      ];

      get.mockResolvedValue(null); // Equipment doesn't exist

      await request(app)
        .post('/api/layout')
        .send(layoutData)
        .expect(404)
        .expect({ message: 'Equipment with ID 999 not found' });
    });
  });

  describe('PUT /api/layout/equipment/:id', () => {
    test('should update existing layout', async () => {
      const updateData = {
        x_position: 150,
        y_position: 250,
        width: 200,
        height: 150
      };

      const updatedLayout = {
        id: 1,
        equipment_id: 1,
        x_position: 150,
        y_position: 250,
        width: 200,
        height: 150
      };

      get.mockResolvedValueOnce({ id: 1 }); // Equipment exists
      get.mockResolvedValueOnce({ id: 1 }); // Layout exists
      run.mockResolvedValue();
      get.mockResolvedValueOnce(updatedLayout);

      const response = await request(app)
        .put('/api/layout/equipment/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedLayout);
    });

    test('should create new layout if none exists', async () => {
      const updateData = {
        x_position: 100,
        y_position: 200
      };

      const newLayout = {
        id: 1,
        equipment_id: 1,
        x_position: 100,
        y_position: 200,
        width: 150,
        height: 100
      };

      get.mockResolvedValueOnce({ id: 1 }); // Equipment exists
      get.mockResolvedValueOnce(null); // No existing layout
      run.mockResolvedValue({ id: 1 });
      get.mockResolvedValueOnce(newLayout);

      const response = await request(app)
        .put('/api/layout/equipment/1')
        .send(updateData)
        .expect(201);

      expect(response.body).toEqual(newLayout);
    });

    test('should return 400 for missing required fields', async () => {
      await request(app)
        .put('/api/layout/equipment/1')
        .send({ x_position: 100 })
        .expect(400)
        .expect({ message: 'x_position and y_position are required' });
    });

    test('should return 404 for non-existent equipment', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .put('/api/layout/equipment/999')
        .send({ x_position: 100, y_position: 200 })
        .expect(404)
        .expect({ message: 'Equipment not found' });
    });
  });

  describe('DELETE /api/layout/equipment/:id', () => {
    test('should delete layout successfully', async () => {
      get.mockResolvedValue({ id: 1 }); // Layout exists
      run.mockResolvedValue();

      await request(app)
        .delete('/api/layout/equipment/1')
        .expect(200)
        .expect({ message: 'Layout deleted' });

      expect(run).toHaveBeenCalledWith('DELETE FROM layout WHERE equipment_id = ?', ['1']);
    });

    test('should return 404 for non-existent layout', async () => {
      get.mockResolvedValue(null);

      await request(app)
        .delete('/api/layout/equipment/999')
        .expect(404)
        .expect({ message: 'Layout not found for this equipment' });
    });
  });

  describe('Text Labels Routes', () => {
    describe('GET /api/layout/labels', () => {
      test('should return all text labels', async () => {
        const mockLabels = [
          { id: 1, content: 'Label 1', x_position: 100, y_position: 200, font_size: 16 },
          { id: 2, content: 'Label 2', x_position: 300, y_position: 400, font_size: 18 }
        ];

        all.mockResolvedValue(mockLabels);

        const response = await request(app)
          .get('/api/layout/labels')
          .expect(200);

        expect(response.body).toEqual(mockLabels);
        expect(all).toHaveBeenCalledWith('SELECT * FROM text_labels');
      });
    });

    describe('GET /api/layout/labels/:id', () => {
      test('should return specific text label', async () => {
        const mockLabel = {
          id: 1,
          content: 'Test Label',
          x_position: 100,
          y_position: 200,
          font_size: 16
        };

        get.mockResolvedValue(mockLabel);

        const response = await request(app)
          .get('/api/layout/labels/1')
          .expect(200);

        expect(response.body).toEqual(mockLabel);
        expect(get).toHaveBeenCalledWith('SELECT * FROM text_labels WHERE id = ?', ['1']);
      });

      test('should return 404 for non-existent label', async () => {
        get.mockResolvedValue(null);

        await request(app)
          .get('/api/layout/labels/999')
          .expect(404)
          .expect({ message: 'Text label not found' });
      });
    });

    describe('POST /api/layout/labels', () => {
      test('should create new text label', async () => {
        const labelData = {
          content: 'New Label',
          x_position: 100,
          y_position: 200,
          font_size: 18
        };

        const newLabel = {
          id: 1,
          ...labelData
        };

        run.mockResolvedValue({ id: 1 });
        get.mockResolvedValue(newLabel);

        const response = await request(app)
          .post('/api/layout/labels')
          .send(labelData)
          .expect(201);

        expect(response.body).toEqual(newLabel);
      });

      test('should create label with default font size', async () => {
        const labelData = {
          content: 'New Label',
          x_position: 100,
          y_position: 200
        };

        const newLabel = {
          id: 1,
          ...labelData,
          font_size: 16
        };

        run.mockResolvedValue({ id: 1 });
        get.mockResolvedValue(newLabel);

        await request(app)
          .post('/api/layout/labels')
          .send(labelData)
          .expect(201);

        expect(run).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO text_labels'),
          ['New Label', 100, 200, 16]
        );
      });

      test('should return 400 for missing required fields', async () => {
        await request(app)
          .post('/api/layout/labels')
          .send({ content: 'Label' })
          .expect(400)
          .expect({ message: 'Content, x_position, and y_position are required' });
      });
    });

    describe('PUT /api/layout/labels/:id', () => {
      test('should update text label', async () => {
        const updateData = {
          content: 'Updated Label',
          x_position: 150,
          font_size: 20
        };

        const updatedLabel = {
          id: 1,
          content: 'Updated Label',
          x_position: 150,
          y_position: 200,
          font_size: 20
        };

        get.mockResolvedValueOnce({ id: 1 }); // Label exists
        run.mockResolvedValue();
        get.mockResolvedValueOnce(updatedLabel);

        const response = await request(app)
          .put('/api/layout/labels/1')
          .send(updateData)
          .expect(200);

        expect(response.body).toEqual(updatedLabel);
      });

      test('should return 404 for non-existent label', async () => {
        get.mockResolvedValue(null);

        await request(app)
          .put('/api/layout/labels/999')
          .send({ content: 'Updated' })
          .expect(404)
          .expect({ message: 'Text label not found' });
      });
    });

    describe('DELETE /api/layout/labels/:id', () => {
      test('should delete text label', async () => {
        get.mockResolvedValue({ id: 1 });
        run.mockResolvedValue();

        await request(app)
          .delete('/api/layout/labels/1')
          .expect(200)
          .expect({ message: 'Text label deleted' });

        expect(run).toHaveBeenCalledWith('DELETE FROM text_labels WHERE id = ?', ['1']);
      });

      test('should return 404 for non-existent label', async () => {
        get.mockResolvedValue(null);

        await request(app)
          .delete('/api/layout/labels/999')
          .expect(404)
          .expect({ message: 'Text label not found' });
      });
    });
  });
});