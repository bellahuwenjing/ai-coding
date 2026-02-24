# AI Scheduling Feature — Implementation Plan

**Feature:** Hybrid Optimal Scheduling (CSP + AI Ranking)
**PRD Reference:** `docs/prd/PRD-hybrid-optimal-scheduling.md`
**Date:** February 22, 2026

---

## Approach Summary

### Do you need an AI agent?

**No.** The feature requires a single LLM inference call — it receives a list of feasible solutions and returns ranked JSON with reasoning. That is not an agent. An agent implies autonomous multi-step reasoning with tool use in a loop. The flow here is:

```
CSP filters → feasible combinations → one LLM call → ranked output
```

One API call, deterministic inputs, structured output.

---

### CSP Solver Decision

**Skip the CSP library entirely.** OR-Tools requires a Python microservice (deployment complexity). `constraint.js` is poorly maintained. For this app's scale — a small business with tens to low hundreds of resources — the "CSP" reduces to two plain JavaScript steps:

1. **Pre-filter** each resource pool against hard constraints (time conflicts, skills, certifications, capacity, condition)
2. **Generate combinations** (cartesian product of filtered pools, deduplicated for quantity > 1)

A company with 50 people, 20 vehicles, and 30 equipment items produces at most a few thousand combinations — trivial for Node.js. No external library needed.

---

### AI Model Decision

Use **Claude Haiku** (`claude-haiku-4-5-20251001`) instead of OpenAI GPT-4o mini. Same cost tier, already in the Anthropic ecosystem, reliable structured JSON output.

---

## New Files

```
schpro-backend/src/
├── services/
│   ├── scheduler.service.js          # Feasibility engine — orchestrates filtering + combinations
│   ├── scheduler-constraints.js      # Pure constraint check functions
│   └── ai-ranking.service.js         # Claude API call — ranks + explains feasible solutions
├── controllers/
│   └── optimal-scheduling.controller.js  # Orchestrates full flow, handles errors
├── routes/
│   └── optimal-scheduling.routes.js      # POST /api/ai/schedule-optimal
└── __tests__/
    └── controllers/
        └── optimal-scheduling.controller.test.js
    └── services/
        ├── scheduler.service.test.js
        └── ai-ranking.service.test.js
```

**New environment variables:**
```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Phase 1 — Feasibility Engine

**Files:** `scheduler.service.js`, `scheduler-constraints.js`

**Steps:**

1. Fetch all non-deleted company resources (people, vehicles, equipment) filtered by `company_id`
2. Fetch all existing booking assignments for the requested time window — query junction tables (`booking_people`, `booking_vehicles`, `booking_equipment`) joined through `bookings` where time overlaps with `[start_time, end_time)`
3. Build three filtered resource pools, one per type, applying hard constraints:

| Constraint | Logic |
|---|---|
| **Time availability** | Exclude any resource ID already in the booked set for the window |
| **Skills (people)** | `required_skills` ⊆ `person.skills` |
| **Certifications (people)** | `required_certifications` ⊆ `person.certifications` |
| **Vehicle capacity** | `vehicle.capacity >= min_capacity` (if specified) |
| **Equipment condition** | Condition rank: excellent=4, good=3, fair=2, poor=1 — must be >= `min_condition` rank |

4. Generate all valid assignment combinations across the filtered pools:
   - One combination = one specific set of resources satisfying all quantities
   - For quantity > 1 of the same type, enforce uniqueness (no duplicate resource in same slot)
   - Implementation: recursive cartesian product with deduplication
5. Cap at **100 combinations** maximum (prevents overwhelming the AI with tokens)
6. Return the array — empty if no feasible assignments exist

**`scheduler-constraints.js` exports (pure functions, easy to unit test):**
```javascript
isAvailable(resourceId, bookedIds)
meetsSkillRequirements(person, requiredSkills, requiredCertifications)
meetsCapacityRequirement(vehicle, minCapacity)
meetsConditionRequirement(equipment, minCondition)
generateCombinations(pools, quantities)  // pools = { people: [...], vehicles: [...], equipment: [...] }
```

---

## Phase 2 — No-Solution Diagnostics

When the combination array is empty, explain *why* with actionable suggestions. No AI needed — this is fully deterministic.

**Approach:** Run each constraint check independently and report which constraint eliminated the most candidates from each pool:

```
"Only 1 person holds AWS D1.1 certification and they are already booked Feb 17"
"No vehicle with capacity >= 8 is available — 2 vans are booked, 1 has capacity 6"
```

**Implementation:** After step 2 above, keep per-constraint elimination counts. If the combinations array is empty, use these counts to build the `violated_constraints` and `suggestions` arrays for the 422 response.

**422 response shape (from PRD):**
```json
{
  "status": "error",
  "message": "No feasible resource assignments found. Constraints cannot be satisfied.",
  "details": {
    "violated_constraints": ["..."],
    "suggestions": ["..."]
  }
}
```

---

## Phase 3 — AI Ranking

**File:** `ai-ranking.service.js`

**Input (assembled in service, not sent raw from controller):**
- All feasible combinations (capped at 100; pre-sorted by a simple heuristic if > 100 — e.g., equipment condition score — before passing to AI)
- Booking context: title, location, time range, `optimize_for` preference
- Resource metadata: hourly_rate, skills, certifications, condition for each resource appearing in any solution
- Historical context: last 50 bookings involving any of these resources (pulled from `bookings` + junction tables)

**Prompt structure (JSON mode via Anthropic API):**
```
You are a scheduling optimizer for a field operations company.
Rank these feasible resource assignments for: {booking.title} at {booking.location}.
Time: {start_time} to {end_time}.
Optimization goal: {optimize_for} — quality=prioritize experience+safety, cost=minimize labor cost, balanced=weighted average.

Feasible solutions: {JSON array, index 0..N}
Resource metadata: {skills, rates, condition per resource}
Historical bookings involving these resources (last 50): {JSON array}

Return valid JSON only:
{
  "rankings": [
    { "solution_index": 0, "score": 95, "reasoning": "...", "warnings": [] },
    ...
  ]
}
Rank all solutions. Score 0-100. Include warnings if any resource has scheduling risks.
```

**Output processing:**
1. Parse JSON response
2. Attach score + reasoning + warnings to each combination object using `solution_index`
3. Sort by score descending
4. Return top `max_solutions` (default 3, max 10)

**Error handling:**
- Claude API failure → 503 with `"AI ranking service unavailable"`
- Malformed JSON response → retry once, then fall back to returning unranked top 5 with a note

---

## Phase 4 — Controller + Route

**Files:** `optimal-scheduling.controller.js`, `optimal-scheduling.routes.js`

**Controller flow:**

```
POST /api/ai/schedule-optimal
  1. Validate input (title, start_time, end_time present; optimize_for is valid enum; quantities >= 1)
  2. Call scheduler.service.js
     → returns feasible combinations array
  3. If empty → return 422 with diagnostics from scheduler
  4. Call ai-ranking.service.js
     → returns ranked solutions
  5. Return 200 with top N solutions
```

**Route registration** in `src/routes/index.js` (or equivalent):
```javascript
app.use('/api/ai', require('./routes/optimal-scheduling.routes'));
```

**Authentication:** Uses existing `verifyToken` middleware — no changes needed.

---

## Phase 5 — Tests

**`scheduler.service.test.js`:**
- Each constraint check function with valid/invalid inputs
- `generateCombinations` with quantity=1 and quantity=2 (uniqueness enforcement)
- Time conflict detection
- Empty pool → empty combinations array
- Diagnostics output when no solutions found

**`ai-ranking.service.test.js`:**
- Mock Anthropic API (`jest.mock`)
- Verify prompt contains expected fields
- Verify response parsing + sorting by score
- Malformed AI response → fallback behavior

**`optimal-scheduling.controller.test.js`:**
- Happy path: valid request → 200 with ranked solutions
- No feasible solutions → 422 with diagnostics
- AI service failure → 503
- Input validation failures → 400

---

## Implementation Order

| Phase | What | Estimated Effort |
|---|---|---|
| 1 | Feasibility engine (filtering + combinations) | 2-3 days |
| 2 | No-solution diagnostics | 0.5 days |
| 3 | AI ranking service | 1-2 days |
| 4 | Controller + route | 1 day |
| 5 | Tests | 2 days |

**Total: ~7-8 days**

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| CSP library | None — plain JS | App scale doesn't need it; eliminates dependency |
| AI model | Claude Haiku | Same cost as GPT-4o mini, already in Anthropic ecosystem |
| AI agent | No | Single deterministic LLM call is sufficient |
| Python microservice | No | Eliminates deployment complexity entirely |
| Scope | Backend only | New route group; no existing endpoints modified |
| AI fallback | Return unranked top 5 | Degraded-but-functional response if Claude API is down |

---

## What Does NOT Change

- Existing booking endpoints (`/api/bookings`) are unchanged
- Database schema is unchanged — no new tables
- Frontend is unchanged for now (this endpoint will be consumed when UI is built)
- Auth middleware is reused as-is
