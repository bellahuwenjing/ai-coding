const request = require('supertest');
const express = require('express');
const optimalController = require('../../controllers/optimal-scheduling.controller');

jest.mock('../../services/scheduler.service', () => ({
  findFeasibleSolutions: jest.fn(),
}));

jest.mock('../../services/ai-ranking.service', () => ({
  rankSolutions: jest.fn(),
}));

jest.mock('../../services/analytics.service', () => ({
  track: jest.fn(),
}));

const { findFeasibleSolutions } = require('../../services/scheduler.service');
const { rankSolutions } = require('../../services/ai-ranking.service');
const { track } = require('../../services/analytics.service');

function createApp(user = { id: 'user-1', company_id: 'co-1' }) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.post('/api/ai/schedule-optimal', optimalController.scheduleOptimal);
  return app;
}

const validBody = {
  title: 'Bridge Inspection',
  location: 'Site A',
  start_time: '2026-01-10T09:00:00Z',
  end_time: '2026-01-10T17:00:00Z',
  requirements: {
    people: [{ role: 'welder', quantity: 2 }],
    vehicles: [],
    equipment: [],
  },
  preferences: { optimize_for: 'skills' },
};

const mockSolutions = [
  {
    rank: 1,
    score: 90,
    reasoning: 'Best fit',
    warnings: [],
    people_ids: ['p1', 'p3'],
    vehicle_ids: [],
    equipment_ids: [],
    estimated_labor_cost: 800,
  },
];

describe('POST /api/ai/schedule-optimal', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // 400 Validation
  // ─────────────────────────────
  it('returns 400 if title is missing', async () => {
    const body = { ...validBody, title: undefined };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/);
  });

  it('returns 400 if start_time is missing', async () => {
    const body = { ...validBody, start_time: undefined };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 if end_time <= start_time', async () => {
    const body = { ...validBody, end_time: '2026-01-10T08:00:00Z' };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/end_time must be after/);
  });

  it('returns 400 if requirements is missing', async () => {
    const body = { ...validBody, requirements: undefined };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 if requirements is an array', async () => {
    const body = { ...validBody, requirements: [] };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 400 if all requirement arrays are empty', async () => {
    const body = { ...validBody, requirements: { people: [], vehicles: [], equipment: [] } };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/At least one requirement/);
  });

  it('returns 400 if a requirement has invalid quantity', async () => {
    const body = {
      ...validBody,
      requirements: { people: [{ role: 'welder', quantity: 0 }], vehicles: [], equipment: [] },
    };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/quantity/);
  });

  it('returns 400 if optimize_for is invalid', async () => {
    const body = { ...validBody, preferences: { optimize_for: 'unknown' } };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/optimize_for/);
  });

  it('returns 400 if company_id is missing from user', async () => {
    const appNoCompany = createApp({ id: 'user-1', company_id: null });
    const res = await request(appNoCompany).post('/api/ai/schedule-optimal').send(validBody);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Company ID/);
  });

  // ─────────────────────────────
  // 422 — No Feasible Solutions
  // ─────────────────────────────
  it('returns 422 with diagnostics when no solutions found', async () => {
    findFeasibleSolutions.mockResolvedValue({
      solutions: [],
      diagnostics: {
        violated_constraints: ['Cannot find 2 person(s) with role "welder" available.'],
        suggestions: ['Consider adding more welders.'],
      },
    });

    const res = await request(app).post('/api/ai/schedule-optimal').send(validBody);

    expect(res.status).toBe(422);
    expect(res.body.violated_constraints).toHaveLength(1);
    expect(res.body.suggestions).toHaveLength(1);
    expect(track).toHaveBeenCalledWith('ai_scheduling.no_solutions', 'co-1', expect.any(Object));
  });

  // ─────────────────────────────
  // 200 — Success
  // ─────────────────────────────
  it('returns 200 with ranked solutions on success', async () => {
    findFeasibleSolutions.mockResolvedValue({
      solutions: [{ people_ids: ['p1', 'p3'], vehicle_ids: [], equipment_ids: [], people_details: [], vehicle_details: [], equipment_details: [] }],
      diagnostics: null,
    });
    rankSolutions.mockResolvedValue(mockSolutions);

    const res = await request(app).post('/api/ai/schedule-optimal').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.solutions).toEqual(mockSolutions);
    expect(res.body.data.optimize_for).toBe('skills');
    expect(track).toHaveBeenCalledWith('ai_scheduling.completed', 'co-1', expect.any(Object));
  });

  it('passes exclude_booking_id to findFeasibleSolutions', async () => {
    findFeasibleSolutions.mockResolvedValue({ solutions: [], diagnostics: { violated_constraints: [], suggestions: [] } });

    const body = { ...validBody, exclude_booking_id: 'booking-abc' };
    await request(app).post('/api/ai/schedule-optimal').send(body);

    expect(findFeasibleSolutions).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'co-1',
      'booking-abc'
    );
  });

  it('defaults optimize_for to balanced when preferences omitted', async () => {
    findFeasibleSolutions.mockResolvedValue({
      solutions: [{ people_ids: ['p1'], vehicle_ids: [], equipment_ids: [], people_details: [], vehicle_details: [], equipment_details: [] }],
      diagnostics: null,
    });
    rankSolutions.mockResolvedValue(mockSolutions);

    const body = { ...validBody, preferences: undefined };
    const res = await request(app).post('/api/ai/schedule-optimal').send(body);

    expect(res.status).toBe(200);
    expect(res.body.data.optimize_for).toBe('balanced');
  });

  // ─────────────────────────────
  // 500 — Internal Error
  // ─────────────────────────────
  it('returns 500 when scheduler throws', async () => {
    findFeasibleSolutions.mockRejectedValue(new Error('Supabase failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const res = await request(app).post('/api/ai/schedule-optimal').send(validBody);

    expect(res.status).toBe(500);
    expect(res.body.status).toBe('error');
    consoleSpy.mockRestore();
  });

  it('returns 500 when rankSolutions throws', async () => {
    findFeasibleSolutions.mockResolvedValue({
      solutions: [{ people_ids: ['p1'], vehicle_ids: [], equipment_ids: [], people_details: [], vehicle_details: [], equipment_details: [] }],
      diagnostics: null,
    });
    rankSolutions.mockRejectedValue(new Error('AI service down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const res = await request(app).post('/api/ai/schedule-optimal').send(validBody);

    expect(res.status).toBe(500);
    consoleSpy.mockRestore();
  });
});
