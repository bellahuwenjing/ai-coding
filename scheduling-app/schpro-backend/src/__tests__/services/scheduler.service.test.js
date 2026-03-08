jest.mock('../../services/supabase.service', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

jest.mock('../../services/scheduler-constraints', () => ({
  generateCombinations: jest.fn(),
}));

const { supabaseAdmin } = require('../../services/supabase.service');
const { generateCombinations } = require('../../services/scheduler-constraints');
const {
  fetchBookedResourceIds,
  fetchAllResources,
  buildDiagnostics,
  findFeasibleSolutions,
} = require('../../services/scheduler.service');

/**
 * Build a thenable Supabase query mock.
 * Calling .then() (i.e., awaiting) resolves with { data, error }.
 */
function makeQuery(data, error = null) {
  const q = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };
  q.then = (resolve) => resolve({ data, error });
  return q;
}

describe('scheduler.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────
  // fetchBookedResourceIds
  // ─────────────────────────────
  describe('fetchBookedResourceIds', () => {
    it('returns empty sets when no overlapping bookings', async () => {
      supabaseAdmin.from.mockReturnValue(makeQuery([]));

      const result = await fetchBookedResourceIds('co-1', '2026-01-01T09:00:00Z', '2026-01-01T17:00:00Z');

      expect(result.bookedPeopleIds.size).toBe(0);
      expect(result.bookedVehicleIds.size).toBe(0);
      expect(result.bookedEquipmentIds.size).toBe(0);
    });

    it('collects person, vehicle, and equipment IDs from overlapping bookings', async () => {
      const overlapping = [
        {
          id: 'b1',
          booking_people: [{ person_id: 'p1' }, { person_id: 'p2' }],
          booking_vehicles: [{ vehicle_id: 'v1' }],
          booking_equipment: [{ equipment_id: 'e1' }],
        },
      ];
      supabaseAdmin.from.mockReturnValue(makeQuery(overlapping));

      const result = await fetchBookedResourceIds('co-1', '2026-01-01T09:00:00Z', '2026-01-01T17:00:00Z');

      expect(result.bookedPeopleIds).toEqual(new Set(['p1', 'p2']));
      expect(result.bookedVehicleIds).toEqual(new Set(['v1']));
      expect(result.bookedEquipmentIds).toEqual(new Set(['e1']));
    });

    it('throws when supabase returns an error', async () => {
      const q = makeQuery(null, new Error('DB error'));
      supabaseAdmin.from.mockReturnValue(q);

      await expect(
        fetchBookedResourceIds('co-1', '2026-01-01T09:00:00Z', '2026-01-01T17:00:00Z')
      ).rejects.toThrow('DB error');
    });
  });

  // ─────────────────────────────
  // fetchAllResources
  // ─────────────────────────────
  describe('fetchAllResources', () => {
    it('returns people, vehicles, and equipment', async () => {
      const mockPeople = [{ id: 'p1', name: 'Alice' }];
      const mockVehicles = [{ id: 'v1', name: 'Van 1' }];
      const mockEquipment = [{ id: 'e1', name: 'Welder A' }];

      supabaseAdmin.from
        .mockReturnValueOnce(makeQuery(mockPeople))   // people
        .mockReturnValueOnce(makeQuery(mockVehicles))  // vehicles
        .mockReturnValueOnce(makeQuery(mockEquipment)); // equipment

      const result = await fetchAllResources('co-1');

      expect(result.people).toEqual(mockPeople);
      expect(result.vehicles).toEqual(mockVehicles);
      expect(result.equipment).toEqual(mockEquipment);
    });

    it('throws when people query fails', async () => {
      supabaseAdmin.from
        .mockReturnValueOnce(makeQuery(null, new Error('people error')))
        .mockReturnValueOnce(makeQuery([]))
        .mockReturnValueOnce(makeQuery([]));

      await expect(fetchAllResources('co-1')).rejects.toThrow('people error');
    });
  });

  // ─────────────────────────────
  // buildDiagnostics
  // ─────────────────────────────
  describe('buildDiagnostics', () => {
    it('returns empty arrays when no diagnostics', () => {
      const result = buildDiagnostics([]);
      expect(result.violated_constraints).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('builds constraint message for unavailable people', () => {
      const diag = [{
        key: 'people_group_0',
        type: 'people',
        groupIndex: 0,
        requirement: { role: 'welder', skills: ['welding'], certifications: ['AWS D1.1'], quantity: 2 },
        availableCount: 0,
      }];
      const result = buildDiagnostics(diag);
      expect(result.violated_constraints[0]).toMatch(/2 person/);
      expect(result.violated_constraints[0]).toMatch(/welder/);
      expect(result.suggestions[0]).toMatch(/adding staff/);
    });

    it('suggests reducing search when people exist but are booked', () => {
      const diag = [{
        key: 'people_group_0',
        type: 'people',
        groupIndex: 0,
        requirement: { role: 'driver', quantity: 1 },
        availableCount: 2,
      }];
      const result = buildDiagnostics(diag);
      expect(result.suggestions[0]).toMatch(/2 person/);
      expect(result.suggestions[0]).toMatch(/booked/);
    });

    it('builds constraint message for unavailable vehicles', () => {
      const diag = [{
        key: 'vehicles_group_0',
        type: 'vehicles',
        groupIndex: 0,
        requirement: { type: 'truck', min_capacity: 10, quantity: 1 },
        availableCount: 0,
      }];
      const result = buildDiagnostics(diag);
      expect(result.violated_constraints[0]).toMatch(/truck/);
      expect(result.violations).toBeUndefined();
    });

    it('builds constraint message for unavailable equipment', () => {
      const diag = [{
        key: 'equipment_group_0',
        type: 'equipment',
        groupIndex: 0,
        requirement: { type: 'crane', min_condition: 'excellent', quantity: 1 },
        availableCount: 0,
      }];
      const result = buildDiagnostics(diag);
      expect(result.violated_constraints[0]).toMatch(/crane/);
    });
  });

  // ─────────────────────────────
  // findFeasibleSolutions
  // ─────────────────────────────
  describe('findFeasibleSolutions', () => {
    const companyId = 'co-1';
    const bookingParams = { start_time: '2026-01-01T09:00:00Z', end_time: '2026-01-01T17:00:00Z' };
    const requirements = { people: [{ role: 'welder', quantity: 1 }], vehicles: [], equipment: [] };

    const mockPeople = [{ id: 'p1', name: 'Alice', role: 'welder', skills: [], certifications: [], hourly_rate: 50 }];
    const mockVehicles = [];
    const mockEquipment = [];

    function setupMocks(overlapping = [], people = mockPeople, vehicles = mockVehicles, equipment = mockEquipment) {
      // findFeasibleSolutions runs Promise.all([fetchAllResources(), fetchBookedResourceIds()]).
      // fetchAllResources runs first and makes 3 from() calls (people, vehicles, equipment).
      // fetchBookedResourceIds runs second and makes 1 from() call (bookings).
      supabaseAdmin.from
        .mockReturnValueOnce(makeQuery(people))       // call 1: people (fetchAllResources)
        .mockReturnValueOnce(makeQuery(vehicles))     // call 2: vehicles (fetchAllResources)
        .mockReturnValueOnce(makeQuery(equipment))    // call 3: equipment (fetchAllResources)
        .mockReturnValueOnce(makeQuery(overlapping)); // call 4: bookings (fetchBookedResourceIds)
    }

    it('returns annotated solutions when feasible', async () => {
      setupMocks();
      generateCombinations.mockReturnValue({
        solutions: [{ people: ['p1'], vehicles: [], equipment: [] }],
        groupDiagnostics: [],
      });

      const result = await findFeasibleSolutions(bookingParams, requirements, companyId);

      expect(result.solutions).toHaveLength(1);
      expect(result.solutions[0].people_ids).toEqual(['p1']);
      expect(result.solutions[0].people_details[0].id).toBe('p1');
      expect(result.diagnostics).toBeNull();
    });

    it('returns empty solutions with diagnostics when none feasible', async () => {
      setupMocks();
      generateCombinations.mockReturnValue({
        solutions: [],
        groupDiagnostics: [{
          key: 'people_group_0',
          type: 'people',
          groupIndex: 0,
          requirement: { role: 'welder', quantity: 1 },
          availableCount: 0,
        }],
      });

      const result = await findFeasibleSolutions(bookingParams, requirements, companyId);

      expect(result.solutions).toHaveLength(0);
      expect(result.diagnostics).not.toBeNull();
      expect(result.diagnostics.violated_constraints.length).toBeGreaterThan(0);
    });

    it('passes excludeBookingId to fetchBookedResourceIds', async () => {
      setupMocks();
      generateCombinations.mockReturnValue({ solutions: [], groupDiagnostics: [] });

      await findFeasibleSolutions(bookingParams, requirements, companyId, 'exclude-me');

      // findFeasibleSolutions calls from() in order: people(0), vehicles(1), equipment(2), bookings(3)
      const fromCalls = supabaseAdmin.from.mock.calls;
      expect(fromCalls[3][0]).toBe('bookings');
    });
  });
});
