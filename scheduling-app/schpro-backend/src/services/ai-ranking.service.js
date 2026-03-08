/**
 * ai-ranking.service.js
 * Uses Claude Haiku to rank feasible scheduling solutions.
 * Single LLM call — no agentic loop needed for MVP.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { supabaseAdmin } = require('./supabase.service');

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 2048;
const MAX_HISTORICAL_BOOKINGS = 10;

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Fetch recent historical bookings for context.
 * Used so Claude can infer past assignment preferences (optional enhancement).
 *
 * @param {string} companyId
 * @returns {object[]} Recent completed bookings with their resource assignments.
 */
async function fetchHistoricalContext(companyId) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, title, start_time, end_time,
      booking_people(person_id),
      booking_vehicles(vehicle_id),
      booking_equipment(equipment_id)
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .lt('end_time', new Date().toISOString())
    .order('end_time', { ascending: false })
    .limit(MAX_HISTORICAL_BOOKINGS);

  if (error) {
    console.warn('ai-ranking: failed to fetch historical context:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Build the prompt for Claude.
 *
 * @param {object} booking - { title, location, start_time, end_time, notes }
 * @param {object[]} solutions - Annotated feasible solutions from scheduler.service.
 * @param {string} optimizeFor - 'cost' | 'skills' | 'availability' | 'balanced'
 * @param {object[]} historicalBookings
 * @returns {string} The user prompt text.
 */
function buildPrompt(booking, solutions, optimizeFor, historicalBookings) {
  const solutionsText = solutions.map((sol, i) => {
    const people = sol.people_details.map(p => {
      const rate = p.hourly_rate ? `$${p.hourly_rate}/hr` : 'rate unknown';
      const skills = p.skills?.length ? p.skills.join(', ') : 'no skills listed';
      const certs = p.certifications?.length ? p.certifications.join(', ') : 'none';
      return `    - ${p.name} (${p.role || 'no role'}, ${rate}, skills: ${skills}, certs: ${certs})`;
    }).join('\n');

    const vehicles = sol.vehicle_details.map(v => {
      const desc = [v.type, v.make, v.model, v.year].filter(Boolean).join(' ');
      return `    - ${v.name}${desc ? ` (${desc})` : ''}, capacity: ${v.capacity ?? 'unknown'}`;
    }).join('\n');

    const equipment = sol.equipment_details.map(e => {
      return `    - ${e.name} (type: ${e.type || 'unknown'}, condition: ${e.condition || 'unknown'})`;
    }).join('\n');

    const parts = [];
    if (people) parts.push(`  People:\n${people}`);
    if (vehicles) parts.push(`  Vehicles:\n${vehicles}`);
    if (equipment) parts.push(`  Equipment:\n${equipment}`);

    // Estimated labor cost
    const durationHours = (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000;
    const laborCost = sol.people_details.reduce((sum, p) => {
      return sum + (p.hourly_rate ? p.hourly_rate * durationHours : 0);
    }, 0);
    const costStr = laborCost > 0 ? `$${laborCost.toFixed(2)}` : 'unknown (missing hourly rates)';

    return `Solution ${i + 1}:\n${parts.join('\n') || '  (no resources required)'}\n  Estimated labor cost: ${costStr}`;
  }).join('\n\n');

  const historySection = historicalBookings.length > 0
    ? `\nHistorical context (last ${historicalBookings.length} completed bookings) - use to infer scheduling preferences:\n` +
      historicalBookings.map(b =>
        `  - "${b.title}" (${b.start_time?.substring(0, 10)}): ` +
        `${b.booking_people?.length || 0} people, ${b.booking_vehicles?.length || 0} vehicles, ${b.booking_equipment?.length || 0} equipment`
      ).join('\n')
    : '';

  return `You are a resource scheduling assistant for a field operations company.

Booking details:
  Title: ${booking.title}
  Location: ${booking.location || 'Not specified'}
  Start: ${booking.start_time}
  End: ${booking.end_time}
  Notes: ${booking.notes || 'None'}
  Optimization goal: ${optimizeFor}
${historySection}

Below are ${solutions.length} feasible assignment solution(s). Rank them from best to worst based on the optimization goal and any relevant factors you can infer (skill match, experience, cost efficiency, equipment condition).

${solutionsText}

Respond with a JSON object only — no markdown, no explanation outside the JSON. The JSON must have this exact structure:
{
  "rankings": [
    {
      "solution_index": 1,
      "score": 95,
      "reasoning": "Brief explanation of why this ranking",
      "warnings": ["Any concerns about this assignment (optional array, can be empty)"]
    }
  ]
}

Where:
- "solution_index" is 1-based (matching the solution numbers above)
- "score" is 0-100 (higher = better fit)
- "rankings" must include ALL ${solutions.length} solution(s), ordered best to worst
- Keep "reasoning" concise (1-2 sentences)`;
}

/**
 * Parse and validate the AI response JSON.
 *
 * @param {string} text - Raw LLM response text.
 * @param {number} solutionCount
 * @returns {object[]|null} Parsed rankings array, or null if invalid.
 */
function parseAIResponse(text, solutionCount) {
  try {
    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.rankings)) return null;
    if (parsed.rankings.length !== solutionCount) {
      console.warn(`ai-ranking: expected ${solutionCount} rankings, got ${parsed.rankings.length}`);
    }

    return parsed.rankings;
  } catch (err) {
    console.error('ai-ranking: failed to parse AI response:', err.message);
    return null;
  }
}

/**
 * Rank feasible solutions using Claude Haiku.
 *
 * @param {object} booking - { title, location, start_time, end_time, notes }
 * @param {object[]} solutions - Annotated feasible solutions.
 * @param {object} preferences - { optimize_for?: string }
 * @param {string} companyId
 * @returns {object[]} Ranked solutions with score, reasoning, warnings, and assignment IDs.
 */
async function rankSolutions(booking, solutions, preferences, companyId) {
  const optimizeFor = preferences?.optimize_for || 'balanced';

  // Fetch historical context (non-blocking failure)
  const historicalBookings = await fetchHistoricalContext(companyId);

  const prompt = buildPrompt(booking, solutions, optimizeFor, historicalBookings);

  let rankings = null;

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content?.[0]?.text || '';
    rankings = parseAIResponse(text, solutions.length);
  } catch (err) {
    console.error('ai-ranking: Claude API call failed:', err.message);
    // Fall through to fallback ranking
  }

  // Build duration for estimated_labor_cost calculation
  const durationHours = (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000;

  if (!rankings) {
    // Fallback: return solutions in order with no AI scoring
    return solutions.map((sol, i) => ({
      rank: i + 1,
      score: null,
      reasoning: 'AI ranking unavailable — solutions listed in arbitrary order.',
      warnings: [],
      people_ids: sol.people_ids,
      vehicle_ids: sol.vehicle_ids,
      equipment_ids: sol.equipment_ids,
      estimated_labor_cost: calculateLaborCost(sol.people_details, durationHours),
    }));
  }

  // Sort by score descending, then merge with solution data
  const sortedRankings = [...rankings].sort((a, b) => (b.score || 0) - (a.score || 0));

  return sortedRankings.map((ranking, rankPosition) => {
    const solutionIdx = ranking.solution_index - 1; // Convert to 0-based
    const sol = solutions[solutionIdx];

    if (!sol) {
      console.warn(`ai-ranking: invalid solution_index ${ranking.solution_index}`);
      return null;
    }

    return {
      rank: rankPosition + 1,
      score: ranking.score,
      reasoning: ranking.reasoning || '',
      warnings: ranking.warnings || [],
      people_ids: sol.people_ids,
      vehicle_ids: sol.vehicle_ids,
      equipment_ids: sol.equipment_ids,
      estimated_labor_cost: calculateLaborCost(sol.people_details, durationHours),
    };
  }).filter(Boolean);
}

function calculateLaborCost(peopleDetails, durationHours) {
  const total = peopleDetails.reduce((sum, p) => {
    return sum + (p.hourly_rate ? parseFloat(p.hourly_rate) * durationHours : 0);
  }, 0);
  return total > 0 ? parseFloat(total.toFixed(2)) : null;
}

module.exports = {
  fetchHistoricalContext,
  buildPrompt,
  rankSolutions,
};
