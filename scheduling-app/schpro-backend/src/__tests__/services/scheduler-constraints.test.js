const {
  CONDITION_RANK,
  filterPeoplePool,
  filterVehiclesPool,
  filterEquipmentPool,
  pickN,
  generateCombinations,
} = require('../../services/scheduler-constraints');

describe('scheduler-constraints', () => {

  // ─────────────────────────────
  // CONDITION_RANK
  // ─────────────────────────────
  describe('CONDITION_RANK', () => {
    it('ranks excellent > good > fair > poor', () => {
      expect(CONDITION_RANK.excellent).toBeGreaterThan(CONDITION_RANK.good);
      expect(CONDITION_RANK.good).toBeGreaterThan(CONDITION_RANK.fair);
      expect(CONDITION_RANK.fair).toBeGreaterThan(CONDITION_RANK.poor);
    });
  });

  // ─────────────────────────────
  // filterPeoplePool
  // ─────────────────────────────
  describe('filterPeoplePool', () => {
    const people = [
      { id: 'p1', name: 'Alice', role: 'welder', skills: ['welding', 'cutting'], certifications: ['AWS D1.1'] },
      { id: 'p2', name: 'Bob', role: 'driver', skills: ['driving'], certifications: [] },
      { id: 'p3', name: 'Carol', role: 'engineer', skills: ['welding', 'design'], certifications: ['PE', 'AWS D1.1'] },
    ];

    it('returns all people when no filters', () => {
      const result = filterPeoplePool(people, { quantity: 1 }, new Set());
      expect(result).toHaveLength(3);
    });

    it('filters by role (case-insensitive partial match)', () => {
      const result = filterPeoplePool(people, { role: 'weld', quantity: 1 }, new Set());
      expect(result.map(p => p.id)).toEqual(['p1']);
    });

    it('filters by skills (must have ALL required skills)', () => {
      const result = filterPeoplePool(people, { skills: ['welding'], quantity: 1 }, new Set());
      expect(result.map(p => p.id)).toContain('p1');
      expect(result.map(p => p.id)).toContain('p3');
      expect(result.map(p => p.id)).not.toContain('p2');
    });

    it('filters by certifications', () => {
      const result = filterPeoplePool(people, { certifications: ['PE'], quantity: 1 }, new Set());
      expect(result.map(p => p.id)).toEqual(['p3']);
    });

    it('excludes booked people', () => {
      const result = filterPeoplePool(people, { quantity: 1 }, new Set(['p1', 'p2']));
      expect(result.map(p => p.id)).toEqual(['p3']);
    });

    it('excludes usedIds (cross-group deduplication)', () => {
      const result = filterPeoplePool(people, { quantity: 1 }, new Set(), new Set(['p3']));
      expect(result.map(p => p.id)).not.toContain('p3');
    });

    it('returns empty when no one matches role', () => {
      const result = filterPeoplePool(people, { role: 'pilot', quantity: 1 }, new Set());
      expect(result).toHaveLength(0);
    });
  });

  // ─────────────────────────────
  // filterVehiclesPool
  // ─────────────────────────────
  describe('filterVehiclesPool', () => {
    const vehicles = [
      { id: 'v1', name: 'Van 1', type: 'van', capacity: 12 },
      { id: 'v2', name: 'Truck 1', type: 'truck', capacity: 8 },
      { id: 'v3', name: 'Van 2', type: 'van', capacity: 6 },
    ];

    it('returns all vehicles when no filters', () => {
      const result = filterVehiclesPool(vehicles, { quantity: 1 }, new Set());
      expect(result).toHaveLength(3);
    });

    it('filters by type (case-insensitive)', () => {
      const result = filterVehiclesPool(vehicles, { type: 'Van', quantity: 1 }, new Set());
      expect(result.map(v => v.id)).toEqual(['v1', 'v3']);
    });

    it('filters by min_capacity', () => {
      const result = filterVehiclesPool(vehicles, { min_capacity: 10, quantity: 1 }, new Set());
      expect(result.map(v => v.id)).toEqual(['v1']);
    });

    it('excludes booked vehicles', () => {
      const result = filterVehiclesPool(vehicles, { quantity: 1 }, new Set(['v1']));
      expect(result.map(v => v.id)).not.toContain('v1');
    });

    it('excludes usedIds', () => {
      const result = filterVehiclesPool(vehicles, { quantity: 1 }, new Set(), new Set(['v2']));
      expect(result.map(v => v.id)).not.toContain('v2');
    });
  });

  // ─────────────────────────────
  // filterEquipmentPool
  // ─────────────────────────────
  describe('filterEquipmentPool', () => {
    const equipment = [
      { id: 'e1', name: 'Welder A', type: 'welder', condition: 'excellent' },
      { id: 'e2', name: 'Welder B', type: 'welder', condition: 'fair' },
      { id: 'e3', name: 'Drill 1', type: 'drill', condition: 'good' },
    ];

    it('returns all equipment when no filters', () => {
      const result = filterEquipmentPool(equipment, { quantity: 1 }, new Set());
      expect(result).toHaveLength(3);
    });

    it('filters by type', () => {
      const result = filterEquipmentPool(equipment, { type: 'welder', quantity: 1 }, new Set());
      expect(result.map(e => e.id)).toEqual(['e1', 'e2']);
    });

    it('filters by min_condition', () => {
      const result = filterEquipmentPool(equipment, { min_condition: 'good', quantity: 1 }, new Set());
      expect(result.map(e => e.id)).toContain('e1');
      expect(result.map(e => e.id)).toContain('e3');
      expect(result.map(e => e.id)).not.toContain('e2'); // fair < good
    });

    it('excludes booked equipment', () => {
      const result = filterEquipmentPool(equipment, { quantity: 1 }, new Set(['e1']));
      expect(result.map(e => e.id)).not.toContain('e1');
    });
  });

  // ─────────────────────────────
  // pickN
  // ─────────────────────────────
  describe('pickN', () => {
    it('returns empty array when n=0', () => {
      expect(pickN(['a', 'b', 'c'], 0)).toEqual([[]]);
    });

    it('returns empty array when n > items.length', () => {
      expect(pickN(['a', 'b'], 3)).toEqual([]);
    });

    it('picks correct number of combinations', () => {
      // C(4,2) = 6
      const result = pickN([1, 2, 3, 4], 2);
      expect(result).toHaveLength(6);
    });

    it('picks 1 combination when n === items.length', () => {
      const result = pickN([1, 2, 3], 3);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual([1, 2, 3]);
    });

    it('each combination has correct size', () => {
      const result = pickN([1, 2, 3, 4, 5], 3);
      result.forEach(combo => expect(combo).toHaveLength(3));
    });

    it('no duplicates within a combination', () => {
      const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const result = pickN(items, 2);
      result.forEach(combo => {
        const ids = combo.map(i => i.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
    });
  });

  // ─────────────────────────────
  // generateCombinations
  // ─────────────────────────────
  describe('generateCombinations', () => {
    const people = [
      { id: 'p1', role: 'welder', skills: ['welding'], certifications: [] },
      { id: 'p2', role: 'driver', skills: ['driving'], certifications: [] },
      { id: 'p3', role: 'welder', skills: ['welding'], certifications: [] },
    ];
    const vehicles = [
      { id: 'v1', type: 'van', capacity: 8 },
      { id: 'v2', type: 'truck', capacity: 12 },
    ];
    const equipment = [
      { id: 'e1', type: 'welder', condition: 'good' },
      { id: 'e2', type: 'welder', condition: 'excellent' },
    ];

    it('finds solutions when requirements can be satisfied', () => {
      const reqs = { people: [{ role: 'welder', quantity: 1 }], vehicles: [], equipment: [] };
      const { solutions, groupDiagnostics } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(), new Set(), new Set()
      );
      expect(solutions.length).toBeGreaterThan(0);
      expect(groupDiagnostics).toHaveLength(0);
      expect(solutions[0].people).toHaveLength(1);
    });

    it('returns no solutions when all matching people are booked', () => {
      const reqs = { people: [{ role: 'welder', quantity: 1 }], vehicles: [], equipment: [] };
      const { solutions, groupDiagnostics } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(['p1', 'p3']), new Set(), new Set()
      );
      expect(solutions).toHaveLength(0);
      expect(groupDiagnostics.length).toBeGreaterThan(0);
      expect(groupDiagnostics[0].type).toBe('people');
    });

    it('enforces cross-group uniqueness (same person cannot fill two groups)', () => {
      // Two separate welder groups — need 2 distinct welders total
      const reqs = {
        people: [
          { role: 'welder', quantity: 1 },
          { role: 'welder', quantity: 1 },
        ],
        vehicles: [],
        equipment: [],
      };
      const { solutions } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(), new Set(), new Set()
      );
      // Each solution should have 2 distinct people
      solutions.forEach(sol => {
        expect(sol.people).toHaveLength(2);
        expect(new Set(sol.people).size).toBe(2);
      });
    });

    it('handles multi-resource requirements (people + vehicles + equipment)', () => {
      const reqs = {
        people: [{ role: 'welder', quantity: 1 }],
        vehicles: [{ type: 'van', quantity: 1 }],
        equipment: [{ type: 'welder', quantity: 1 }],
      };
      const { solutions } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(), new Set(), new Set()
      );
      expect(solutions.length).toBeGreaterThan(0);
      solutions.forEach(sol => {
        expect(sol.people).toHaveLength(1);
        expect(sol.vehicles).toHaveLength(1);
        expect(sol.equipment).toHaveLength(1);
      });
    });

    it('respects maxSolutions cap', () => {
      const reqs = { people: [{ quantity: 1 }], vehicles: [], equipment: [] };
      const { solutions } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(), new Set(), new Set(),
        2 // cap at 2
      );
      expect(solutions.length).toBeLessThanOrEqual(2);
    });

    it('returns empty solutions with diagnostics when no people match role', () => {
      const reqs = { people: [{ role: 'pilot', quantity: 1 }], vehicles: [], equipment: [] };
      const { solutions, groupDiagnostics } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(), new Set(), new Set()
      );
      expect(solutions).toHaveLength(0);
      expect(groupDiagnostics.length).toBeGreaterThan(0);
      expect(groupDiagnostics[0].availableCount).toBe(0);
    });

    it('handles empty requirements (no resource groups)', () => {
      const reqs = { people: [], vehicles: [], equipment: [] };
      const { solutions } = generateCombinations(
        reqs, people, vehicles, equipment,
        new Set(), new Set(), new Set()
      );
      // With no groups, one "empty" solution should be produced
      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual({ people: [], vehicles: [], equipment: [] });
    });
  });
});
