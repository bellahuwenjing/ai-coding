const request = require('supertest');
const express = require('express');
const bookingController = require('../../controllers/booking.controller');

// Mock the supabase service
jest.mock('../../services/supabase.service', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const { supabaseAdmin } = require('../../services/supabase.service');

// Build a minimal Express app that injects a mock user
function createApp(user = { id: 'user-123', company_id: 'company-456' }) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.get('/api/bookings', bookingController.getAll);
  app.post('/api/bookings', bookingController.create);
  app.get('/api/bookings/:id', bookingController.getOne);
  app.put('/api/bookings/:id', bookingController.update);
  app.delete('/api/bookings/:id', bookingController.softDelete);
  app.post('/api/bookings/:id/restore', bookingController.restore);
  return app;
}

describe('Booking Controller', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // POST /api/bookings - Create with requirements
  // ─────────────────────────────────────────────
  describe('POST /api/bookings', () => {
    it('creates booking with valid requirements', async () => {
      const mockBooking = {
        id: 'booking-1',
        title: 'Bridge Inspection',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          people: [
            { role: 'welder', skills: ['welding'], certifications: ['AWS D1.1'], quantity: 2 }
          ],
          vehicles: [
            { type: 'van', min_capacity: 8, quantity: 1 }
          ],
          equipment: [
            { type: 'welder', min_condition: 'good', quantity: 2 }
          ]
        }
      };

      // Mock the insert
      supabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      // Mock junction table inserts (empty - no resources assigned yet)
      supabaseAdmin.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      const res = await request(app).post('/api/bookings').send({
        title: 'Bridge Inspection',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: mockBooking.requirements
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.requirements).toEqual(mockBooking.requirements);
    });

    it('creates booking without requirements (defaults to empty object)', async () => {
      const mockBooking = {
        id: 'booking-1',
        title: 'Simple Booking',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {}
      };

      supabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      const res = await request(app).post('/api/bookings').send({
        title: 'Simple Booking',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z'
        // No requirements field
      });

      expect(res.status).toBe(201);
      expect(res.body.data.requirements).toEqual({});
    });

    it('returns 400 when requirements is not an object', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: 'invalid' // Should be object
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Requirements must be an object');
    });

    it('returns 400 when people requirements quantity < 1', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          people: [{ role: 'welder', quantity: 0 }]
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('People requirement quantity must be at least 1');
    });

    it('returns 400 when vehicle requirements quantity < 1', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          vehicles: [{ type: 'van', quantity: 0 }]
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Vehicle requirement quantity must be at least 1');
    });

    it('returns 400 when equipment requirements quantity < 1', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          equipment: [{ type: 'drill', quantity: -1 }]
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Equipment requirement quantity must be at least 1');
    });

    it('returns 400 when equipment min_condition is invalid', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          equipment: [{ type: 'drill', min_condition: 'brand-new', quantity: 1 }]
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Equipment min_condition must be excellent, good, fair, or poor');
    });

    it('accepts valid equipment min_condition values', async () => {
      const mockBooking = {
        id: 'booking-1',
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          equipment: [
            { type: 'drill', min_condition: 'excellent', quantity: 1 }
          ]
        }
      };

      supabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: mockBooking.requirements
      });

      expect(res.status).toBe(201);
    });

    it('returns 400 when people.skills is not an array', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          people: [{ role: 'welder', skills: 'welding', quantity: 1 }] // Should be array
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('People requirement skills must be an array');
    });

    it('returns 400 when people.certifications is not an array', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          people: [{ role: 'welder', certifications: 'AWS D1.1', quantity: 1 }] // Should be array
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('People requirement certifications must be an array');
    });
  });

  // ─────────────────────────────────────────────
  // PUT /api/bookings/:id - Update with requirements
  // ─────────────────────────────────────────────
  describe('PUT /api/bookings/:id', () => {
    it('updates booking with new requirements', async () => {
      const mockBooking = {
        id: 'booking-1',
        title: 'Updated Booking',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          people: [{ role: 'driver', quantity: 1 }],
          vehicles: [],
          equipment: []
        }
      };

      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      // Mock junction table deletes and inserts
      supabaseAdmin.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const res = await request(app).put('/api/bookings/booking-1').send({
        title: 'Updated Booking',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: mockBooking.requirements
      });

      expect(res.status).toBe(200);
      expect(res.body.data.requirements).toEqual(mockBooking.requirements);
    });

    it('allows omitting requirements in update (keeps existing)', async () => {
      const mockBooking = {
        id: 'booking-1',
        title: 'Updated Title Only',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: { people: [], vehicles: [], equipment: [] } // Existing unchanged
      };

      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      supabaseAdmin.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const res = await request(app).put('/api/bookings/booking-1').send({
        title: 'Updated Title Only',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z'
        // No requirements field - should keep existing
      });

      expect(res.status).toBe(200);
    });

    it('validates requirements on update', async () => {
      const res = await request(app).put('/api/bookings/booking-1').send({
        title: 'Test',
        start_time: '2026-02-20T09:00:00Z',
        end_time: '2026-02-20T17:00:00Z',
        requirements: {
          people: [{ role: 'welder', quantity: 0 }] // Invalid
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('People requirement quantity must be at least 1');
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/bookings - List with requirements
  // ─────────────────────────────────────────────
  describe('GET /api/bookings', () => {
    it('returns bookings with requirements field', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          title: 'Booking 1',
          requirements: { people: [{ role: 'welder', quantity: 1 }], vehicles: [], equipment: [] },
          booking_people: [],
          booking_vehicles: [],
          booking_equipment: []
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockBookings, error: null })
      });

      const res = await request(app).get('/api/bookings');

      expect(res.status).toBe(200);
      expect(res.body.data[0].requirements).toBeDefined();
      expect(res.body.data[0].requirements.people).toHaveLength(1);
    });
  });
});
