/**
 * optimal-scheduling.controller.js
 * POST /api/ai/schedule-optimal
 *
 * Validates inputs, runs the feasibility engine, calls AI ranking,
 * and returns ranked scheduling solutions.
 */

const { findFeasibleSolutions } = require('../services/scheduler.service');
const { rankSolutions } = require('../services/ai-ranking.service');
const { track } = require('../services/analytics.service');

const VALID_OPTIMIZE_FOR = ['cost', 'skills', 'availability', 'balanced'];

/**
 * POST /api/ai/schedule-optimal
 */
exports.scheduleOptimal = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    if (!companyId) {
      return res.status(400).json({
        status: 'error',
        message: 'Company ID not found. Please login again.'
      });
    }

    const {
      title,
      location,
      start_time,
      end_time,
      notes,
      requirements,
      preferences,
      exclude_booking_id,
    } = req.body;

    // --- Validate required fields ---
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        status: 'error',
        message: 'title, start_time, and end_time are required.'
      });
    }

    // --- Validate time range ---
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'start_time and end_time must be valid ISO date strings.'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        status: 'error',
        message: 'end_time must be after start_time.'
      });
    }

    // --- Validate requirements ---
    if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
      return res.status(400).json({
        status: 'error',
        message: 'requirements must be an object with people, vehicles, and/or equipment arrays.'
      });
    }

    const { people = [], vehicles = [], equipment = [] } = requirements;

    if (!Array.isArray(people) || !Array.isArray(vehicles) || !Array.isArray(equipment)) {
      return res.status(400).json({
        status: 'error',
        message: 'requirements.people, requirements.vehicles, and requirements.equipment must be arrays.'
      });
    }

    if (people.length === 0 && vehicles.length === 0 && equipment.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one requirement group (people, vehicles, or equipment) must be specified.'
      });
    }

    // Validate each requirement group has a valid quantity
    for (const req of [...people, ...vehicles, ...equipment]) {
      if (!req.quantity || typeof req.quantity !== 'number' || req.quantity < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Each requirement group must have a quantity of at least 1.'
        });
      }
    }

    // --- Validate preferences ---
    const optimizeFor = preferences?.optimize_for || 'balanced';
    if (!VALID_OPTIMIZE_FOR.includes(optimizeFor)) {
      return res.status(400).json({
        status: 'error',
        message: `preferences.optimize_for must be one of: ${VALID_OPTIMIZE_FOR.join(', ')}.`
      });
    }

    // --- Run feasibility engine ---
    const normalizedRequirements = { people, vehicles, equipment };
    const bookingParams = { start_time, end_time };

    const { solutions, diagnostics } = await findFeasibleSolutions(
      bookingParams,
      normalizedRequirements,
      companyId,
      exclude_booking_id || null
    );

    // --- No feasible solutions ---
    if (solutions.length === 0) {
      track('ai_scheduling.no_solutions', companyId, {
        requirement_groups: people.length + vehicles.length + equipment.length,
      });

      return res.status(422).json({
        status: 'error',
        message: 'No feasible scheduling solutions found for the given requirements and time slot.',
        violated_constraints: diagnostics?.violated_constraints || [],
        suggestions: diagnostics?.suggestions || [],
      });
    }

    // --- Rank with AI ---
    const booking = { title, location, start_time, end_time, notes };
    const rankedSolutions = await rankSolutions(booking, solutions, preferences, companyId);

    track('ai_scheduling.completed', companyId, {
      solutions_found: solutions.length,
      optimize_for: optimizeFor,
    });

    return res.status(200).json({
      status: 'success',
      message: `Found ${rankedSolutions.length} scheduling solution(s), ranked by ${optimizeFor}.`,
      data: {
        solutions: rankedSolutions,
        total_found: solutions.length,
        optimize_for: optimizeFor,
      }
    });

  } catch (error) {
    console.error('optimal-scheduling error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during scheduling.'
    });
  }
};
