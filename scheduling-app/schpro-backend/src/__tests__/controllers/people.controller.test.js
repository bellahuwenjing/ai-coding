const request = require('supertest');
const express = require('express');
const peopleController = require('../../controllers/people.controller');

// Mock the supabase service - no real DB calls in tests
jest.mock('../../services/supabase.service', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const { supabaseAdmin } = require('../../services/supabase.service');

// Build a minimal Express app that injects a mock user, bypassing auth middleware
function createApp(user = { id: 'user-123', company_id: 'company-456' }) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.get('/api/people', peopleController.getAll);
  app.post('/api/people', peopleController.create);
  app.get('/api/people/:id', peopleController.getOne);
  app.put('/api/people/:id', peopleController.update);
  app.delete('/api/people/:id', peopleController.softDelete);
  app.post('/api/people/:id/restore', peopleController.restore);
  return app;
}

describe('People Controller', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  // ─────────────────────────────────────────────
  // GET /api/people
  // ─────────────────────────────────────────────
  describe('GET /api/people', () => {
    it('returns 200 with list of people for the company', async () => {
      const mockPeople = [
        { id: '1', name: 'Alice', email: 'alice@test.com', company_id: 'company-456' },
        { id: '2', name: 'Bob', email: 'bob@test.com', company_id: 'company-456' },
      ];

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockPeople, error: null }),
      });

      const res = await request(app).get('/api/people');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Alice');
    });

    it('returns 400 when company_id is missing from token', async () => {
      app = createApp({ id: 'user-123' }); // no company_id

      const res = await request(app).get('/api/people');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Company ID not found');
    });

    it('returns 500 on database error', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const res = await request(app).get('/api/people');

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/people
  // ─────────────────────────────────────────────
  describe('POST /api/people', () => {
    it('returns 201 and creates person with required fields', async () => {
      const newPerson = { id: 'new-id', name: 'Charlie', email: 'charlie@test.com', company_id: 'company-456' };

      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newPerson, error: null }),
      });

      const res = await request(app)
        .post('/api/people')
        .send({ name: 'Charlie', email: 'charlie@test.com' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('created successfully');
      expect(res.body.data.name).toBe('Charlie');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/people')
        .send({ email: 'charlie@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Name and email are required');
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/people')
        .send({ name: 'Charlie' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Name and email are required');
    });

    it('returns 500 on database error', async () => {
      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const res = await request(app)
        .post('/api/people')
        .send({ name: 'Charlie', email: 'charlie@test.com' });

      expect(res.status).toBe(500);
    });
  });

  // ─────────────────────────────────────────────
  // PUT /api/people/:id
  // ─────────────────────────────────────────────
  describe('PUT /api/people/:id', () => {
    it('returns 200 and updates person successfully', async () => {
      const updatedPerson = { id: '1', name: 'Alice Updated', email: 'alice@test.com' };

      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedPerson, error: null }),
      });

      const res = await request(app)
        .put('/api/people/1')
        .send({ name: 'Alice Updated', email: 'alice@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Alice Updated');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .put('/api/people/1')
        .send({ name: 'Alice Updated' }); // missing email

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Name and email are required');
    });

    it('returns 404 when person not found or belongs to different company', async () => {
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const res = await request(app)
        .put('/api/people/nonexistent')
        .send({ name: 'Test', email: 'test@test.com' });

      expect(res.status).toBe(404);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /api/people/:id
  // ─────────────────────────────────────────────
  describe('DELETE /api/people/:id', () => {
    it('returns 200 and soft deletes person', async () => {
      const deletedPerson = { id: '1', name: 'Alice', is_deleted: true };

      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: deletedPerson, error: null }),
      });

      const res = await request(app).delete('/api/people/1');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('returns 404 when person not found or already deleted', async () => {
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const res = await request(app).delete('/api/people/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('already deleted');
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/people/:id/restore
  // ─────────────────────────────────────────────
  describe('POST /api/people/:id/restore', () => {
    it('returns 200 and restores a deleted person', async () => {
      const restoredPerson = { id: '1', name: 'Alice', is_deleted: false };

      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: restoredPerson, error: null }),
      });

      const res = await request(app).post('/api/people/1/restore');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('restored successfully');
    });

    it('returns 404 when person not found or not deleted', async () => {
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const res = await request(app).post('/api/people/nonexistent/restore');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not deleted');
    });
  });
});
