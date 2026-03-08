jest.mock('../../services/supabase.service', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock('@anthropic-ai/sdk');

const { supabaseAdmin } = require('../../services/supabase.service');
const Anthropic = require('@anthropic-ai/sdk');
const { fetchHistoricalContext, buildPrompt, rankSolutions } = require('../../services/ai-ranking.service');

function makeQuery(data, error = null) {
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  q.then = (resolve) => resolve({ data, error });
  return q;
}

const mockBooking = {
  title: 'Bridge Inspection',
  location: 'Site A',
  start_time: '2026-01-10T09:00:00Z',
  end_time: '2026-01-10T17:00:00Z',
  notes: 'Safety gear required',
};

const mockSolutions = [
  {
    people_ids: ['p1'],
    vehicle_ids: [],
    equipment_ids: [],
    people_details: [{ id: 'p1', name: 'Alice', role: 'welder', skills: ['welding'], certifications: [], hourly_rate: 50 }],
    vehicle_details: [],
    equipment_details: [],
  },
  {
    people_ids: ['p2'],
    vehicle_ids: [],
    equipment_ids: [],
    people_details: [{ id: 'p2', name: 'Bob', role: 'welder', skills: ['welding', 'cutting'], certifications: ['AWS D1.1'], hourly_rate: 65 }],
    vehicle_details: [],
    equipment_details: [],
  },
];

describe('ai-ranking.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // fetchHistoricalContext
  // ─────────────────────────────
  describe('fetchHistoricalContext', () => {
    it('returns historical bookings', async () => {
      const mockData = [{ id: 'b1', title: 'Past Job', start_time: '2025-12-01T09:00:00Z' }];
      supabaseAdmin.from.mockReturnValue(makeQuery(mockData));

      const result = await fetchHistoricalContext('co-1');
      expect(result).toEqual(mockData);
    });

    it('returns empty array and logs warning on DB error', async () => {
      supabaseAdmin.from.mockReturnValue(makeQuery(null, new Error('DB error')));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await fetchHistoricalContext('co-1');
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('failed to fetch'), expect.any(String));

      consoleSpy.mockRestore();
    });
  });

  // ─────────────────────────────
  // buildPrompt
  // ─────────────────────────────
  describe('buildPrompt', () => {
    it('includes booking title and time', () => {
      const prompt = buildPrompt(mockBooking, mockSolutions, 'balanced', []);
      expect(prompt).toContain('Bridge Inspection');
      expect(prompt).toContain('2026-01-10T09:00:00Z');
    });

    it('includes person names and roles', () => {
      const prompt = buildPrompt(mockBooking, mockSolutions, 'balanced', []);
      expect(prompt).toContain('Alice');
      expect(prompt).toContain('Bob');
    });

    it('includes optimization goal', () => {
      const prompt = buildPrompt(mockBooking, mockSolutions, 'cost', []);
      expect(prompt).toContain('cost');
    });

    it('includes solution count in prompt', () => {
      const prompt = buildPrompt(mockBooking, mockSolutions, 'balanced', []);
      expect(prompt).toContain('2 feasible');
    });

    it('includes historical context when provided', () => {
      const history = [{ title: 'Old Job', start_time: '2025-11-01T00:00:00Z', booking_people: [{ person_id: 'p1' }], booking_vehicles: [], booking_equipment: [] }];
      const prompt = buildPrompt(mockBooking, mockSolutions, 'balanced', history);
      expect(prompt).toContain('Old Job');
    });

    it('includes estimated labor cost', () => {
      // 8h * $50/hr = $400
      const prompt = buildPrompt(mockBooking, mockSolutions, 'balanced', []);
      expect(prompt).toContain('400.00');
    });
  });

  // ─────────────────────────────
  // rankSolutions
  // ─────────────────────────────
  describe('rankSolutions', () => {
    let mockCreate;

    beforeEach(() => {
      mockCreate = jest.fn();
      Anthropic.mockImplementation(() => ({
        messages: { create: mockCreate },
      }));
      // Suppress historical context call
      supabaseAdmin.from.mockReturnValue(makeQuery([]));
    });

    it('returns ranked solutions from AI response', async () => {
      const aiResponse = {
        content: [{
          text: JSON.stringify({
            rankings: [
              { solution_index: 2, score: 90, reasoning: 'Better certifications', warnings: [] },
              { solution_index: 1, score: 70, reasoning: 'Less experienced', warnings: ['No certs'] },
            ]
          })
        }]
      };
      mockCreate.mockResolvedValue(aiResponse);

      const result = await rankSolutions(mockBooking, mockSolutions, { optimize_for: 'skills' }, 'co-1');

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].score).toBe(90);
      expect(result[0].people_ids).toEqual(['p2']); // solution_index: 2 → solutions[1]
    });

    it('returns fallback ranking when AI call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await rankSolutions(mockBooking, mockSolutions, {}, 'co-1');

      expect(result).toHaveLength(2);
      expect(result[0].score).toBeNull();
      expect(result[0].reasoning).toMatch(/unavailable/);

      consoleSpy.mockRestore();
    });

    it('returns fallback ranking when AI response is malformed JSON', async () => {
      mockCreate.mockResolvedValue({ content: [{ text: 'not valid json {' }] });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await rankSolutions(mockBooking, mockSolutions, {}, 'co-1');

      expect(result).toHaveLength(2);
      expect(result[0].score).toBeNull();

      consoleSpy.mockRestore();
    });

    it('includes estimated_labor_cost', async () => {
      const aiResponse = {
        content: [{
          text: JSON.stringify({
            rankings: [
              { solution_index: 1, score: 80, reasoning: 'Good fit', warnings: [] },
              { solution_index: 2, score: 75, reasoning: 'Also fine', warnings: [] },
            ]
          })
        }]
      };
      mockCreate.mockResolvedValue(aiResponse);

      const result = await rankSolutions(mockBooking, mockSolutions, {}, 'co-1');
      // 8h * $50 = $400 for solution 1 (Alice), 8h * $65 = $520 for solution 2 (Bob)
      const solution1 = result.find(r => r.people_ids[0] === 'p1');
      const solution2 = result.find(r => r.people_ids[0] === 'p2');
      expect(solution1.estimated_labor_cost).toBe(400);
      expect(solution2.estimated_labor_cost).toBe(520);
    });

    it('handles solutions with no hourly_rate (null cost)', async () => {
      const solutionsNoRate = [{
        ...mockSolutions[0],
        people_details: [{ ...mockSolutions[0].people_details[0], hourly_rate: null }],
      }];
      const aiResponse = {
        content: [{
          text: JSON.stringify({
            rankings: [{ solution_index: 1, score: 80, reasoning: 'Good', warnings: [] }]
          })
        }]
      };
      mockCreate.mockResolvedValue(aiResponse);

      const result = await rankSolutions(mockBooking, solutionsNoRate, {}, 'co-1');
      expect(result[0].estimated_labor_cost).toBeNull();
    });

    it('defaults optimize_for to balanced', async () => {
      const aiResponse = {
        content: [{
          text: JSON.stringify({
            rankings: [
              { solution_index: 1, score: 80, reasoning: 'Good', warnings: [] },
              { solution_index: 2, score: 60, reasoning: 'Less', warnings: [] },
            ]
          })
        }]
      };
      mockCreate.mockResolvedValue(aiResponse);

      // No preferences provided
      await rankSolutions(mockBooking, mockSolutions, null, 'co-1');

      const promptArg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(promptArg).toContain('balanced');
    });

    it('strips markdown fences from AI JSON response', async () => {
      const aiResponse = {
        content: [{
          text: '```json\n' + JSON.stringify({
            rankings: [
              { solution_index: 1, score: 85, reasoning: 'Great', warnings: [] },
              { solution_index: 2, score: 70, reasoning: 'OK', warnings: [] },
            ]
          }) + '\n```'
        }]
      };
      mockCreate.mockResolvedValue(aiResponse);

      const result = await rankSolutions(mockBooking, mockSolutions, {}, 'co-1');
      expect(result[0].score).toBe(85);
    });
  });
});
