/**
 * scheduler.service.js
 * Orchestrates feasibility checking:
 *  1. Fetch all resources for the company.
 *  2. Fetch booked resource IDs for the requested time slot.
 *  3. Generate all feasible assignment combinations.
 *  4. Return solutions + diagnostics.
 */

const { supabaseAdmin } = require('./supabase.service');
const { generateCombinations } = require('./scheduler-constraints');

const MAX_SOLUTIONS = 20;

/**
 * Fetch IDs of people, vehicles, and equipment already booked in a time slot.
 * Overlapping means: existing_start < requested_end AND existing_end > requested_start
 *
 * @param {string} companyId
 * @param {string} startTime - ISO string
 * @param {string} endTime   - ISO string
 * @param {string|null} [excludeBookingId] - Booking ID to exclude (for update scenarios)
 * @returns {{ bookedPeopleIds: Set<string>, bookedVehicleIds: Set<string>, bookedEquipmentIds: Set<string> }}
 */
async function fetchBookedResourceIds(companyId, startTime, endTime, excludeBookingId = null) {
  // Find all non-deleted bookings for this company that overlap the time window
  let query = supabaseAdmin
    .from('bookings')
    .select(`
      id,
      booking_people(person_id),
      booking_vehicles(vehicle_id),
      booking_equipment(equipment_id)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data: overlapping, error } = await query;

  if (error) throw error;

  const bookedPeopleIds = new Set();
  const bookedVehicleIds = new Set();
  const bookedEquipmentIds = new Set();

  for (const booking of (overlapping || [])) {
    for (const r of (booking.booking_people || [])) bookedPeopleIds.add(r.person_id);
    for (const r of (booking.booking_vehicles || [])) bookedVehicleIds.add(r.vehicle_id);
    for (const r of (booking.booking_equipment || [])) bookedEquipmentIds.add(r.equipment_id);
  }

  return { bookedPeopleIds, bookedVehicleIds, bookedEquipmentIds };
}

/**
 * Fetch all active (non-deleted) people, vehicles, and equipment for a company.
 *
 * @param {string} companyId
 * @returns {{ people: object[], vehicles: object[], equipment: object[] }}
 */
async function fetchAllResources(companyId) {
  const [peopleResult, vehiclesResult, equipmentResult] = await Promise.all([
    supabaseAdmin
      .from('people')
      .select('id, name, email, role, skills, certifications, hourly_rate, home_address')
      .eq('company_id', companyId)
      .eq('is_deleted', false),

    supabaseAdmin
      .from('vehicles')
      .select('id, name, type, capacity, make, model, year')
      .eq('company_id', companyId)
      .eq('is_deleted', false),

    supabaseAdmin
      .from('equipment')
      .select('id, name, type, condition, manufacturer, model')
      .eq('company_id', companyId)
      .eq('is_deleted', false),
  ]);

  if (peopleResult.error) throw peopleResult.error;
  if (vehiclesResult.error) throw vehiclesResult.error;
  if (equipmentResult.error) throw equipmentResult.error;

  return {
    people: peopleResult.data || [],
    vehicles: vehiclesResult.data || [],
    equipment: equipmentResult.data || [],
  };
}

/**
 * Build a human-readable diagnostic message from group diagnostics.
 *
 * @param {object[]} groupDiagnostics - Raw diagnostic data from generateCombinations.
 * @returns {{ violated_constraints: string[], suggestions: string[] }}
 */
function buildDiagnostics(groupDiagnostics) {
  const violated_constraints = [];
  const suggestions = [];

  for (const diag of groupDiagnostics) {
    const { type, groupIndex, requirement, availableCount } = diag;

    if (type === 'people') {
      const qty = requirement.quantity || 1;
      const parts = [];
      if (requirement.role) parts.push(`role "${requirement.role}"`);
      if (requirement.skills?.length) parts.push(`skills [${requirement.skills.join(', ')}]`);
      if (requirement.certifications?.length) parts.push(`certifications [${requirement.certifications.join(', ')}]`);

      const desc = parts.length ? parts.join(', ') : 'any role';
      violated_constraints.push(
        `Cannot find ${qty} person(s) with ${desc} available in this time slot.`
      );

      if (availableCount > 0) {
        suggestions.push(
          `There ${availableCount === 1 ? 'is' : 'are'} ${availableCount} person(s) with ${desc} in your company, but all are booked during this time.`
        );
      } else {
        suggestions.push(
          `No person with ${desc} found. Consider adding staff or relaxing the requirements.`
        );
      }
    } else if (type === 'vehicles') {
      const qty = requirement.quantity || 1;
      const parts = [];
      if (requirement.type) parts.push(`type "${requirement.type}"`);
      if (requirement.min_capacity) parts.push(`min capacity ${requirement.min_capacity}`);

      const desc = parts.length ? parts.join(', ') : 'any type';
      violated_constraints.push(
        `Cannot find ${qty} vehicle(s) with ${desc} available in this time slot.`
      );

      if (availableCount > 0) {
        suggestions.push(
          `There ${availableCount === 1 ? 'is' : 'are'} ${availableCount} vehicle(s) with ${desc} in your fleet, but all are booked during this time.`
        );
      } else {
        suggestions.push(
          `No vehicle with ${desc} found. Consider adding vehicles or relaxing the requirements.`
        );
      }
    } else if (type === 'equipment') {
      const qty = requirement.quantity || 1;
      const parts = [];
      if (requirement.type) parts.push(`type "${requirement.type}"`);
      if (requirement.min_condition) parts.push(`min condition "${requirement.min_condition}"`);

      const desc = parts.length ? parts.join(', ') : 'any type';
      violated_constraints.push(
        `Cannot find ${qty} equipment item(s) with ${desc} available in this time slot.`
      );

      if (availableCount > 0) {
        suggestions.push(
          `There ${availableCount === 1 ? 'is' : 'are'} ${availableCount} equipment item(s) with ${desc} in your inventory, but all are booked during this time.`
        );
      } else {
        suggestions.push(
          `No equipment with ${desc} found. Consider adding equipment or relaxing the requirements.`
        );
      }
    }
  }

  return { violated_constraints, suggestions };
}

/**
 * Find all feasible assignment combinations for a booking's requirements.
 *
 * @param {object} bookingParams - { start_time, end_time }
 * @param {object} requirements - { people: [], vehicles: [], equipment: [] }
 * @param {string} companyId
 * @param {string|null} [excludeBookingId]
 * @returns {{ solutions: object[], diagnostics: object|null }}
 */
async function findFeasibleSolutions(bookingParams, requirements, companyId, excludeBookingId = null) {
  const { start_time, end_time } = bookingParams;

  const [resources, bookedIds] = await Promise.all([
    fetchAllResources(companyId),
    fetchBookedResourceIds(companyId, start_time, end_time, excludeBookingId),
  ]);

  const { people, vehicles, equipment } = resources;
  const { bookedPeopleIds, bookedVehicleIds, bookedEquipmentIds } = bookedIds;

  const { solutions, groupDiagnostics } = generateCombinations(
    requirements,
    people,
    vehicles,
    equipment,
    bookedPeopleIds,
    bookedVehicleIds,
    bookedEquipmentIds,
    MAX_SOLUTIONS
  );

  if (solutions.length === 0) {
    const diagnostics = buildDiagnostics(groupDiagnostics);
    return { solutions: [], diagnostics };
  }

  // Annotate solutions with full resource objects for downstream use (AI ranking)
  const peopleById = Object.fromEntries(people.map(p => [p.id, p]));
  const vehiclesById = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const equipmentById = Object.fromEntries(equipment.map(e => [e.id, e]));

  const annotatedSolutions = solutions.map(sol => ({
    people_ids: sol.people,
    vehicle_ids: sol.vehicles,
    equipment_ids: sol.equipment,
    people_details: sol.people.map(id => peopleById[id]).filter(Boolean),
    vehicle_details: sol.vehicles.map(id => vehiclesById[id]).filter(Boolean),
    equipment_details: sol.equipment.map(id => equipmentById[id]).filter(Boolean),
  }));

  return { solutions: annotatedSolutions, diagnostics: null };
}

module.exports = {
  fetchBookedResourceIds,
  fetchAllResources,
  buildDiagnostics,
  findFeasibleSolutions,
};
