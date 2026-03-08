/**
 * scheduler-constraints.js
 * Pure functions for filtering resource pools and generating feasible assignment combinations.
 * No side effects — all inputs are plain data, all outputs are plain data.
 */

/** Maps condition strings to numeric rank (higher = better). */
const CONDITION_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
};

/**
 * Filter the people pool against a single requirement group.
 *
 * @param {object[]} people - All available people for this company.
 * @param {object} requirement - { role?, skills?, certifications?, quantity }
 * @param {Set<string>} bookedIds - IDs already committed to other bookings in this slot.
 * @param {Set<string>} usedIds - IDs already assigned to other requirement groups in this solution.
 * @returns {object[]} Eligible people.
 */
function filterPeoplePool(people, requirement, bookedIds, usedIds = new Set()) {
  const { role, skills = [], certifications = [] } = requirement;

  return people.filter(person => {
    // Exclude already-booked or already-used-in-this-solution people
    if (bookedIds.has(person.id)) return false;
    if (usedIds.has(person.id)) return false;

    // Role match (case-insensitive, partial match allowed)
    if (role) {
      const personRole = (person.role || '').toLowerCase();
      if (!personRole.includes(role.toLowerCase())) return false;
    }

    // Skills: person must have ALL required skills
    if (skills.length > 0) {
      const personSkills = (person.skills || []).map(s => s.toLowerCase());
      const hasAllSkills = skills.every(req =>
        personSkills.some(ps => ps.includes(req.toLowerCase()))
      );
      if (!hasAllSkills) return false;
    }

    // Certifications: person must have ALL required certifications
    if (certifications.length > 0) {
      const personCerts = (person.certifications || []).map(c => c.toLowerCase());
      const hasAllCerts = certifications.every(req =>
        personCerts.some(pc => pc.includes(req.toLowerCase()))
      );
      if (!hasAllCerts) return false;
    }

    return true;
  });
}

/**
 * Filter the vehicles pool against a single requirement group.
 *
 * @param {object[]} vehicles - All available vehicles for this company.
 * @param {object} requirement - { type?, min_capacity?, quantity }
 * @param {Set<string>} bookedIds - IDs already committed to other bookings in this slot.
 * @param {Set<string>} usedIds - IDs already assigned to other requirement groups in this solution.
 * @returns {object[]} Eligible vehicles.
 */
function filterVehiclesPool(vehicles, requirement, bookedIds, usedIds = new Set()) {
  const { type, min_capacity } = requirement;

  return vehicles.filter(vehicle => {
    if (bookedIds.has(vehicle.id)) return false;
    if (usedIds.has(vehicle.id)) return false;

    // Type match
    if (type) {
      const vehicleType = (vehicle.type || '').toLowerCase();
      if (!vehicleType.includes(type.toLowerCase())) return false;
    }

    if (min_capacity != null) {
      const capacity = vehicle.capacity ?? 0;
      if (capacity < min_capacity) return false;
    }

    return true;
  });
}

/**
 * Filter the equipment pool against a single requirement group.
 *
 * @param {object[]} equipment - All available equipment for this company.
 * @param {object} requirement - { type?, min_condition?, quantity }
 * @param {Set<string>} bookedIds - IDs already committed to other bookings in this slot.
 * @param {Set<string>} usedIds - IDs already assigned to other requirement groups in this solution.
 * @returns {object[]} Eligible equipment items.
 */
function filterEquipmentPool(equipment, requirement, bookedIds, usedIds = new Set()) {
  const { type, min_condition } = requirement;

  return equipment.filter(item => {
    if (bookedIds.has(item.id)) return false;
    if (usedIds.has(item.id)) return false;

    // Type match
    if (type) {
      const itemType = (item.type || '').toLowerCase();
      if (!itemType.includes(type.toLowerCase())) return false;
    }

    // Minimum condition
    if (min_condition) {
      const itemRank = CONDITION_RANK[item.condition] ?? 0;
      const minRank = CONDITION_RANK[min_condition] ?? 0;
      if (itemRank < minRank) return false;
    }

    return true;
  });
}

/**
 * Return all size-n combinations of items (indices).
 * E.g. pickN([a,b,c,d], 2) → [[a,b],[a,c],[a,d],[b,c],[b,d],[c,d]]
 *
 * @param {any[]} items
 * @param {number} n
 * @returns {any[][]}
 */
function pickN(items, n) {
  if (n === 0) return [[]];
  if (n > items.length) return [];

  const result = [];

  function backtrack(start, current) {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Generate all feasible assignment combinations across all requirement groups.
 *
 * Each "solution" is an object:
 *   { people: [id,...], vehicles: [id,...], equipment: [id,...] }
 *
 * Enforces cross-group uniqueness — the same resource cannot satisfy two groups.
 *
 * @param {object} requirementGroups - { people: [{...}], vehicles: [{...}], equipment: [{...}] }
 * @param {object[]} availablePeople - Pre-fetched, not-booked people records.
 * @param {object[]} availableVehicles - Pre-fetched, not-booked vehicle records.
 * @param {object[]} availableEquipment - Pre-fetched, not-booked equipment records.
 * @param {Set<string>} bookedPeopleIds
 * @param {Set<string>} bookedVehicleIds
 * @param {Set<string>} bookedEquipmentIds
 * @param {number} [maxSolutions=20] - Cap to avoid combinatorial explosion.
 * @returns {{ solutions: object[], groupDiagnostics: object[] }}
 */
function generateCombinations(
  requirementGroups,
  availablePeople,
  availableVehicles,
  availableEquipment,
  bookedPeopleIds,
  bookedVehicleIds,
  bookedEquipmentIds,
  maxSolutions = 20
) {
  const peopleReqs = requirementGroups.people || [];
  const vehicleReqs = requirementGroups.vehicles || [];
  const equipmentReqs = requirementGroups.equipment || [];

  const groupDiagnostics = [];
  const solutions = [];

  /**
   * Recursive backtracking across requirement groups.
   * groupIndex: which group we are currently assigning
   * partialSolution: IDs chosen so far { people:[], vehicles:[], equipment:[] }
   * usedPeopleIds / usedVehicleIds / usedEquipmentIds: cross-group deduplication
   */
  function recurse(
    groupIndex,
    peopleGroupIdx,
    vehicleGroupIdx,
    equipGroupIdx,
    partialSolution,
    usedPeopleIds,
    usedVehicleIds,
    usedEquipmentIds
  ) {
    if (solutions.length >= maxSolutions) return;

    // Try people groups
    if (peopleGroupIdx < peopleReqs.length) {
      const req = peopleReqs[peopleGroupIdx];
      const qty = req.quantity || 1;
      const pool = filterPeoplePool(availablePeople, req, bookedPeopleIds, usedPeopleIds);
      const combos = pickN(pool, qty);

      if (combos.length === 0) {
        // Record diagnostic for this group
        const diagKey = `people_group_${peopleGroupIdx}`;
        if (!groupDiagnostics.find(d => d.key === diagKey)) {
          groupDiagnostics.push({
            key: diagKey,
            type: 'people',
            groupIndex: peopleGroupIdx,
            requirement: req,
            availableCount: filterPeoplePool(availablePeople, req, new Set(), new Set()).length,
            bookedCount: filterPeoplePool(availablePeople, req, bookedPeopleIds, new Set()).length - filterPeoplePool(availablePeople, req, bookedPeopleIds, usedPeopleIds).length,
          });
        }
        return; // This branch is infeasible
      }

      for (const combo of combos) {
        if (solutions.length >= maxSolutions) break;
        const ids = combo.map(p => p.id);
        const newUsed = new Set([...usedPeopleIds, ...ids]);
        recurse(
          groupIndex + 1,
          peopleGroupIdx + 1,
          vehicleGroupIdx,
          equipGroupIdx,
          { ...partialSolution, people: [...partialSolution.people, ...ids] },
          newUsed,
          usedVehicleIds,
          usedEquipmentIds
        );
      }
      return;
    }

    // Try vehicle groups
    if (vehicleGroupIdx < vehicleReqs.length) {
      const req = vehicleReqs[vehicleGroupIdx];
      const qty = req.quantity || 1;
      const pool = filterVehiclesPool(availableVehicles, req, bookedVehicleIds, usedVehicleIds);
      const combos = pickN(pool, qty);

      if (combos.length === 0) {
        const diagKey = `vehicles_group_${vehicleGroupIdx}`;
        if (!groupDiagnostics.find(d => d.key === diagKey)) {
          groupDiagnostics.push({
            key: diagKey,
            type: 'vehicles',
            groupIndex: vehicleGroupIdx,
            requirement: req,
            availableCount: filterVehiclesPool(availableVehicles, req, new Set(), new Set()).length,
          });
        }
        return;
      }

      for (const combo of combos) {
        if (solutions.length >= maxSolutions) break;
        const ids = combo.map(v => v.id);
        const newUsed = new Set([...usedVehicleIds, ...ids]);
        recurse(
          groupIndex + 1,
          peopleGroupIdx,
          vehicleGroupIdx + 1,
          equipGroupIdx,
          { ...partialSolution, vehicles: [...partialSolution.vehicles, ...ids] },
          usedPeopleIds,
          newUsed,
          usedEquipmentIds
        );
      }
      return;
    }

    // Try equipment groups
    if (equipGroupIdx < equipmentReqs.length) {
      const req = equipmentReqs[equipGroupIdx];
      const qty = req.quantity || 1;
      const pool = filterEquipmentPool(availableEquipment, req, bookedEquipmentIds, usedEquipmentIds);
      const combos = pickN(pool, qty);

      if (combos.length === 0) {
        const diagKey = `equipment_group_${equipGroupIdx}`;
        if (!groupDiagnostics.find(d => d.key === diagKey)) {
          groupDiagnostics.push({
            key: diagKey,
            type: 'equipment',
            groupIndex: equipGroupIdx,
            requirement: req,
            availableCount: filterEquipmentPool(availableEquipment, req, new Set(), new Set()).length,
          });
        }
        return;
      }

      for (const combo of combos) {
        if (solutions.length >= maxSolutions) break;
        const ids = combo.map(e => e.id);
        const newUsed = new Set([...usedEquipmentIds, ...ids]);
        recurse(
          groupIndex + 1,
          peopleGroupIdx,
          vehicleGroupIdx,
          equipGroupIdx + 1,
          { ...partialSolution, equipment: [...partialSolution.equipment, ...ids] },
          usedPeopleIds,
          usedVehicleIds,
          newUsed
        );
      }
      return;
    }

    // All groups satisfied — record solution
    solutions.push({ ...partialSolution });
  }

  recurse(
    0, 0, 0, 0,
    { people: [], vehicles: [], equipment: [] },
    new Set(), new Set(), new Set()
  );

  return { solutions, groupDiagnostics };
}

module.exports = {
  CONDITION_RANK,
  filterPeoplePool,
  filterVehiclesPool,
  filterEquipmentPool,
  pickN,
  generateCombinations,
};
