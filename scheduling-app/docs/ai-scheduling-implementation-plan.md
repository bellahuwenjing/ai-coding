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
| 2 | No-solution diagnostics (static) | 0.5 days |
| 3 | AI ranking service | 1-2 days |
| 4 | Controller + route | 1 day |
| 5 | Tests | 2 days |
| 6 | Travel time / distance-aware scheduling (agent upgrade) | 3-4 days |
| 7 | Intelligent constraint relaxation (agent upgrade) | 3-4 days |

**MVP total (Phases 1-5): ~7-8 days**
**With agent upgrades (Phases 6-7): ~14-16 days**

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| CSP library | None — plain JS | App scale doesn't need it; eliminates dependency |
| AI model | Claude Haiku | Same cost as GPT-4o mini, already in Anthropic ecosystem |
| AI agent (MVP) | No | Single deterministic LLM call is sufficient |
| AI agent (Phases 6-7) | Yes | External API calls and iterative reasoning require tool use |
| Python microservice | No | Eliminates deployment complexity entirely |
| Scope | Backend only | New route group; no existing endpoints modified |
| AI fallback | Return unranked top 5 | Degraded-but-functional response if Claude API is down |

---

## What Does NOT Change (MVP)

- Existing booking endpoints (`/api/bookings`) are unchanged
- Database schema is unchanged — no new tables (MVP only; Phase 6 adds `home_address` to `people`)
- Frontend is unchanged for now (this endpoint will be consumed when UI is built)
- Auth middleware is reused as-is

---

---

## Phase 6 — Travel Time / Distance-Aware Scheduling

> **This phase introduces the AI agent pattern.** The LLM can no longer receive all needed data upfront — it must call a Maps API mid-reasoning to compute travel time per candidate resource. This is the first use of tool calling in the app.

### Why This Triggers an Agent

Travel time from a person's home to the job site cannot be precomputed generically. It depends on:
- Which specific person is being evaluated (their home address)
- The job site location (from the booking)
- Day of week and time of day (traffic patterns)

The agent evaluates each candidate person, decides to call the Maps API for that person's commute estimate, receives the result, and factors it into the ranking — all before moving to the next candidate. This interleaving of reasoning and data-fetching is what defines agent behavior.

---

### Prerequisite: Add `home_address` to People

#### 1. Database — `people` table

Add column via Supabase SQL editor:

```sql
ALTER TABLE people ADD COLUMN home_address TEXT;
```

No migration file needed — run directly in the Supabase dashboard SQL editor.

#### 2. Backend — `people.controller.js`

Add `home_address` to the fields handled in `create` and `update`:

```javascript
// In create and update handlers, add to destructuring:
const { name, email, phone, skills, certifications, hourly_rate, home_address } = req.body;

// Add to insert/update object:
home_address: home_address || null
```

#### 3. Frontend — `PersonForm.jsx`

Add a text input field for home address below the existing phone field:

```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Home Address
  </label>
  <input
    type="text"
    name="home_address"
    value={formData.home_address}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
    placeholder="e.g., 123 Main St, San Francisco, CA"
  />
</div>
```

Also add `home_address: ''` to the `formData` initial state and to the edit-mode population `useEffect`.

---

### Agent Architecture

**Tool the agent can call:**

```javascript
{
  name: "get_travel_time",
  description: "Get estimated travel time in minutes between two addresses using Google Maps API",
  input_schema: {
    origin: "string",      // person's home_address
    destination: "string", // booking location
    departure_time: "ISO8601 string"
  }
}
```

**Agent flow:**

```
1. Agent receives: feasible solutions + booking location + resource metadata
2. For each candidate person in the feasible set:
   a. Agent calls get_travel_time(person.home_address, booking.location, booking.start_time)
   b. Receives: { duration_minutes: 42, distance_km: 31 }
   c. Stores result alongside person metadata
3. Agent ranks all solutions using travel time as a soft ranking factor:
   - "quality" mode: slightly penalise very long commutes (>60 min)
   - "cost" mode: factor travel time as implicit labor overhead
   - "balanced" mode: weight commute as 10% of score
4. Returns ranked solutions with travel time included in reasoning
   e.g. "Alice is 18 minutes away — shortest commute of the three candidates"
```

**New file:** `src/services/maps.service.js`
- Wraps Google Maps Distance Matrix API
- Input: origin address, destination address, departure ISO timestamp
- Output: `{ duration_minutes, distance_km }`
- Error handling: if address is missing or Maps API fails, return `null` and agent skips travel factor for that person

**Modified file:** `src/services/ai-ranking.service.js`
- Switch from single LLM call to agent loop using Anthropic tool use API
- Register `get_travel_time` as an available tool
- Handle tool call → execute `maps.service.js` → return result → continue agent turn
- Agent loop terminates when model returns `end_turn` with no pending tool calls

**New environment variable:**
```env
GOOGLE_MAPS_API_KEY=AIza...
```

**New npm package:**
```bash
npm install @googlemaps/google-maps-services-js
```

---

### 422 Enhancement

When no feasible solutions exist and travel time is a factor, the agent can include commute context in the suggestion:

```
"The only available certified welder lives 95 minutes from the job site.
 Consider moving the start time to 11am to allow a reasonable commute."
```

---

### Tests

- `maps.service.test.js` — mock Google Maps API, verify input formatting, verify null return on missing address
- `ai-ranking.service.test.js` — update to mock tool call loop; verify agent correctly invokes `get_travel_time` and incorporates result
- Add test case: person with missing `home_address` — travel factor skipped gracefully

---

---

## Phase 7 — Intelligent Constraint Relaxation

> **This phase upgrades the static Phase 2 diagnostics to an agent.** Instead of a fixed one-pass analysis, the agent iteratively relaxes constraints — calling the feasibility engine as a tool after each relaxation — to find the minimum change that would unlock a valid assignment.

### Why This Triggers an Agent

The current Phase 2 diagnostics run once and report what blocked feasibility. An intelligent relaxation needs to:

1. Identify which constraint is blocking
2. Try relaxing it (e.g., drop a certification requirement)
3. Re-run the feasibility engine to check if that unlocks solutions
4. If yes — report the relaxation and how many solutions it opens
5. If no — try a different relaxation
6. Combine multiple relaxations if needed

Step 3 is a tool call whose result determines step 4-6. This iterative branching cannot be done in a single prompt.

---

### Agent Architecture

**Tool the agent can call:**

```javascript
{
  name: "check_feasibility",
  description: "Run the constraint solver with modified requirements and return the number of feasible solutions found",
  input_schema: {
    booking: "object",             // original booking time window
    requirements: "object",        // modified requirements to test
    company_id: "string"           // injected by server, not from agent
  }
}
```

**Agent flow (triggered only when Phase 1 returns 0 solutions):**

```
1. Agent receives: original requirements + constraint violation report from Phase 1
2. Agent identifies the most likely blocking constraint (highest elimination count from Phase 1 diagnostics)
3. Agent proposes a relaxation and calls check_feasibility(relaxed_requirements)
4. If result > 0:
   → Record this relaxation as a working suggestion
   → Try a different relaxation to offer multiple options
5. If result == 0:
   → Try a different relaxation strategy
6. Agent terminates after finding up to 3 working relaxations or exhausting options
7. Returns structured suggestions with exact counts:
   "Removing the AWS D1.1 requirement opens 4 feasible assignments"
   "Shifting the start time to 2pm opens 2 feasible assignments (welder becomes available at 1:30pm)"
```

**Relaxation strategies the agent may try (in rough priority order):**

| Relaxation | Example |
|---|---|
| Drop a certification requirement | Remove AWS D1.1 — adds N people to pool |
| Drop a skill requirement | Remove "rigging" — adds N people to pool |
| Relax equipment condition | Change min_condition from "excellent" to "good" |
| Relax vehicle capacity | Reduce min_capacity from 10 to 8 |
| Time window shift | Suggest booking 2 hours later — specific resource becomes available |
| Quantity reduction | "Only 1 certified welder available — can the job be done with 1 instead of 2?" |

---

### Implementation

**New file:** `src/services/constraint-relaxation.service.js`
- Wraps the agent loop for the no-solution case
- Injects `company_id` into `check_feasibility` tool calls (never exposed to agent directly — security)
- Calls `scheduler.service.js` internally when tool is invoked
- Returns array of `{ relaxation_description, solutions_unlocked, modified_requirements }`

**Modified file:** `src/controllers/optimal-scheduling.controller.js`
- When `scheduler.service.js` returns empty array:
  - Previously: call static diagnostics → return 422
  - Now: call `constraint-relaxation.service.js` (agent) → return 422 with richer suggestions

**Modified file:** `src/services/scheduler.service.js`
- Export `checkFeasibility(requirements, companyId)` as a standalone function (reused by both the main flow and the relaxation agent's tool handler)

---

### Security Note

The `check_feasibility` tool always has `company_id` injected server-side before the feasibility check runs. The agent receives booking/requirements context but never has direct DB access — it only calls the tool, which is controlled code. This maintains multi-tenant isolation even during agent tool use.

---

### 422 Response Enhancement

The upgraded 422 response includes agent-generated suggestions with concrete counts:

```json
{
  "status": "error",
  "message": "No feasible resource assignments found.",
  "details": {
    "violated_constraints": [
      "Only 1 person holds AWS D1.1 certification and they are booked Feb 17",
      "No vehicle with capacity >= 8 is available"
    ],
    "suggestions": [
      {
        "description": "Remove the AWS D1.1 certification requirement",
        "solutions_unlocked": 4,
        "trade_off": "Assignments would include uncertified welders — confirm this is acceptable for this job type"
      },
      {
        "description": "Shift booking to Feb 18 at 9am",
        "solutions_unlocked": 2,
        "trade_off": "One day later than planned — the certified welder and a large-capacity van both become available"
      }
    ]
  }
}
```

---

### Tests

- `constraint-relaxation.service.test.js` — mock `check_feasibility` tool responses; verify agent tries multiple relaxations; verify it terminates after 3 working suggestions
- Verify `company_id` is never passed to the agent context (only injected at tool execution time)
- Test agent termination when all relaxation strategies are exhausted (returns empty suggestions array)
