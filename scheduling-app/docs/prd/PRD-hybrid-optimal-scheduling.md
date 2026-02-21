# PRD: Hybrid Optimal Scheduling (CSP + AI)
## SchedulePro - Constraint-Aware AI-Ranked Resource Assignment

---

## 1. Overview

### 1.1 Feature Summary

A hybrid scheduling system that combines **Constraint Satisfaction Programming (CSP)** with **AI reasoning** to find and rank optimal resource assignments for bookings. CSP ensures all hard constraints are satisfied (availability, skills, capacity); AI ranks feasible solutions by soft preferences and provides natural language explanations.

**Primary Endpoint:** `POST /api/ai/schedule-optimal`

### 1.2 Problem Statement

**Limitations of pure algorithmic approaches:**
- Keyword matching (current MVP) misses semantic relationships and context
- Hard to encode complex business rules (team composition, historical performance, travel time)
- No optimization across multiple constraints simultaneously

**Limitations of pure AI approaches:**
- Cannot guarantee constraint satisfaction (might suggest unavailable resources)
- Expensive to run AI on every possible combination
- Black-box reasoning makes debugging hard

**The hybrid solution:**
1. **CSP handles hard constraints** — guarantees no time conflicts, required skills met, capacity sufficient
2. **AI handles soft preferences** — ranks solutions by business context (historical performance, workload balance, cost) and explains reasoning in natural language

This leverages the strengths of both: CSP's mathematical rigor for feasibility, AI's contextual intelligence for optimization.

### 1.3 Feature Scope

**In scope:**
- CSP-based constraint solver to find all feasible resource assignments
- Hard constraints: time availability, skill requirements, vehicle capacity, equipment condition
- AI ranking of feasible solutions by soft preferences
- Natural language explanation for each ranked solution
- Support for single booking optimization (MVP)
- Optional: batch optimization for multiple bookings (P1)

**Out of scope (future):**
- Real-time re-optimization as bookings change
- Multi-objective optimization UI (sliders for cost vs. quality trade-offs)
- Learning from user's past assignment choices to refine preferences
- Recurring booking pattern optimization

---

## 2. Technical Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| CSP Solver | Google OR-Tools (Python) via subprocess/API | Industry-standard, highly optimized |
| Alternative CSP | constraint.js (JavaScript) | Pure Node.js, less powerful but simpler |
| AI Provider | OpenAI API | `gpt-4o-mini` for ranking + explanation |
| AI Input Mode | Structured JSON context | All feasible solutions + booking context |
| AI Output Mode | JSON mode for rankings + text for reasoning | Mix of structured scores and narrative |

### 2.1 CSP Solver Choice

**Option A: Google OR-Tools (Recommended)**

**Pros:**
- Industry-leading constraint solver
- Handles complex constraints (global constraints, optimization objectives)
- Battle-tested in production scheduling systems
- Rich constraint types (AllDifferent, Circuit, Cumulative for resource calendars)

**Cons:**
- Python library (requires subprocess call from Node.js or REST wrapper service)
- Additional deployment complexity

**Implementation approach:**
- Create a Python microservice: `POST /csp/solve` that accepts constraints and returns feasible solutions
- Node.js backend calls this service
- Deploy Python service alongside Express backend (e.g., separate Railway service or AWS Lambda)

**Option B: constraint.js**

**Pros:**
- Pure JavaScript, runs in Node.js natively
- Simple integration, no subprocess overhead

**Cons:**
- Less mature, fewer advanced constraint types
- May struggle with complex multi-constraint problems
- Limited documentation and community

**MVP Recommendation:** Start with **constraint.js** for speed. Upgrade to **OR-Tools** if constraints become too complex.

---

## 3. Architecture

```
User Request
    ↓
Input Validation (Node.js)
    ↓
[1] CSP Solver (constraint.js or OR-Tools Python service)
    Input: Booking requirements + all company resources + existing bookings
    Process: Define variables (which person/vehicle/equipment to assign)
             Define domains (available resources per variable)
             Define constraints (time conflicts, skills, capacity)
    Output: Array of feasible solutions (each = specific assignment of resources)
    ↓
[2] AI Ranking (OpenAI GPT-4o mini)
    Input: All feasible solutions + context (historical bookings, resource metadata)
    Process: Score each solution based on soft preferences
             Generate reasoning for top 3-5 solutions
    Output: Ranked solutions with scores + natural language explanations
    ↓
Response to User (top N solutions with reasoning)
```

---

## 4. API Specification

### 4.1 POST /api/ai/schedule-optimal

**Authentication:** Required (`Authorization: Bearer <token>`)

**Request Body:**

```json
{
  "booking": {
    "title": "Bridge Inspection",
    "start_time": "2026-02-17T09:00:00Z",
    "end_time": "2026-02-17T17:00:00Z",
    "location": "Golden Gate Bridge"
  },
  "requirements": {
    "people": [
      { "role": "welder", "skills": ["welding"], "certifications": ["AWS D1.1"], "quantity": 1 },
      { "role": "driver", "skills": ["driving"], "certifications": ["CDL-A"], "quantity": 1 }
    ],
    "vehicles": [
      { "type": "van", "min_capacity": 8, "quantity": 1 }
    ],
    "equipment": [
      { "type": "welder", "min_condition": "good", "quantity": 1 }
    ]
  },
  "preferences": {
    "optimize_for": "quality",        // "quality" | "cost" | "balanced"
    "avoid_overtime": true,
    "prefer_experienced": true,
    "max_solutions": 5                // Return top N solutions
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `booking` | object | Yes | Time, title, location |
| `requirements` | object | Yes | People, vehicles, equipment with quantities and constraints |
| `requirements.*.quantity` | number | Yes | How many of this resource type needed |
| `preferences` | object | No | Soft preferences for AI ranking |
| `preferences.optimize_for` | enum | No | "quality" (experienced, good equipment), "cost" (minimize hourly_rate), "balanced" |
| `preferences.max_solutions` | number | No | Default 3, max 10 |

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "feasible_solutions_count": 12,
    "solutions": [
      {
        "rank": 1,
        "score": 95,
        "assignments": {
          "people": [
            { "id": "p1", "name": "Alice Johnson", "role": "welder", "hourly_rate": 45 }
          ],
          "vehicles": [
            { "id": "v3", "name": "Ford Transit Van", "capacity": 8 }
          ],
          "equipment": [
            { "id": "e2", "name": "Miller Welder XL", "condition": "excellent" }
          ]
        },
        "total_cost_estimate": 360,
        "reasoning": "Alice is the strongest match — she holds the AWS D1.1 certification and has completed 8 similar bridge inspection jobs over the past year with zero safety incidents. The Miller Welder XL is in excellent condition and was last serviced 2 weeks ago. The Ford Transit has sufficient capacity and is located at the downtown depot, 15 minutes from the job site.",
        "warnings": []
      },
      {
        "rank": 2,
        "score": 88,
        "assignments": {
          "people": [
            { "id": "p4", "name": "Marcus Lee", "role": "welder", "hourly_rate": 38 }
          ],
          "vehicles": [
            { "id": "v3", "name": "Ford Transit Van", "capacity": 8 }
          ],
          "equipment": [
            { "id": "e5", "name": "Lincoln Welder Pro", "condition": "good" }
          ]
        },
        "total_cost_estimate": 304,
        "reasoning": "Marcus holds the required certification and costs $7/hour less than Alice. However, he has only completed 2 bridge jobs in the past year. The Lincoln Welder is in good condition but is due for maintenance in 3 weeks.",
        "warnings": [
          "Marcus has a tight schedule — only 1 hour gap before his next job at 6pm. Confirm the bridge job can finish by 5pm."
        ]
      }
    ]
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Missing required fields, invalid `optimize_for` value, quantity < 1 |
| 422 | CSP solver found **zero feasible solutions** (no resources satisfy all hard constraints) |
| 503 | CSP solver service unavailable (if using OR-Tools microservice) |
| 503 | OpenAI API call failed |
| 500 | Unexpected internal error |

**422 response (no feasible solutions):**
```json
{
  "status": "error",
  "message": "No feasible resource assignments found. Constraints cannot be satisfied.",
  "details": {
    "violated_constraints": [
      "No available welders with AWS D1.1 certification in the requested time window",
      "All vans with capacity >= 8 are already booked"
    ],
    "suggestions": [
      "Consider shifting the booking to Wednesday Feb 18 when 2 certified welders are available",
      "Reduce vehicle capacity requirement to 6 — 3 vans would then be available"
    ]
  }
}
```

---

## 5. CSP Constraint Definitions

### 5.1 Variables

For a booking requiring:
- `n_people` people
- `n_vehicles` vehicles
- `n_equipment` equipment items

Define variables: `person_1, person_2, ..., person_n`, `vehicle_1, ..., vehicle_m`, `equipment_1, ..., equipment_k`

### 5.2 Domains

Each variable's domain = all company resources of that type that are:
- Not soft-deleted (`is_deleted = false`)
- Match the required type/role (if specified)

### 5.3 Hard Constraints

**C1: Time Availability**
- For each assigned resource, it must NOT be booked in any overlapping booking
- Query: resource NOT IN (booked_ids for time window `[start_time, end_time)`)

**C2: Skill Requirements (people)**
- `required_skills ⊆ person.skills` (all required skills present)
- `required_certifications ⊆ person.certifications` (all required certs present)

**C3: Vehicle Capacity**
- `vehicle.capacity >= min_capacity` (if min_capacity specified)

**C4: Equipment Condition**
- `equipment.condition >= min_condition` (ordering: excellent > good > fair > poor)

**C5: Uniqueness (if quantity > 1)**
- `AllDifferent([person_1, person_2, ...])` — cannot assign the same person twice
- Same for vehicles and equipment

### 5.4 Optimization Objective (optional, CSP-level)

If CSP solver supports optimization (OR-Tools does):
- **Minimize cost:** `SUM(person_i.hourly_rate * hours)`
- **Maximize equipment quality:** `SUM(condition_score(equipment_i))`

For MVP with constraint.js (no optimization), CSP just returns **all feasible solutions** and AI handles ranking.

---

## 6. AI Ranking Criteria

Once CSP returns feasible solutions, AI ranks them based on soft preferences:

### 6.1 Quality Optimization (`optimize_for: "quality"`)

**Factors AI considers (in order of weight):**

1. **Historical performance (40%)** — Has this person/team done similar jobs? Success rate? Safety record?
2. **Equipment condition (25%)** — Prefer excellent > good > fair (even if all satisfy `min_condition`)
3. **Experience level (20%)** — Years in role, number of completed jobs, certifications beyond required
4. **Team composition (10%)** — Have these people worked together before? Complementary skills?
5. **Resource freshness (5%)** — Time since last maintenance (vehicles/equipment), time since last job (people — avoid burnout)

**Prompt structure:**
```
You are a scheduling optimizer. Rank these feasible resource assignments for a bridge inspection job.

Optimize for: QUALITY (prioritize experience, safety record, equipment condition).

Feasible solutions: [JSON array of solutions]
Historical data: [past bookings involving these resources]
Resource metadata: [skills, certifications, equipment service dates, etc.]

Return JSON:
{
  "rankings": [
    { "solution_id": 1, "score": 95, "reasoning": "..." },
    ...
  ]
}
```

### 6.2 Cost Optimization (`optimize_for: "cost"`)

**Factors:**
1. **Total labor cost (60%)** — `SUM(hourly_rate × hours)`
2. **Equipment operating cost (20%)** — Newer equipment may have lower fuel/maintenance costs
3. **Travel cost (10%)** — Resource location proximity to job site
4. **Overtime avoidance (10%)** — Avoid assigning people near weekly hour limits

### 6.3 Balanced Optimization (`optimize_for: "balanced"`)

Weighted average of quality and cost scoring.

---

## 7. Processing Flow

```
[1] Input Validation
    - booking.start_time < booking.end_time
    - All requirements have quantity >= 1
    - optimize_for is valid enum

[2] Fetch All Company Resources (Parallel)
    - fetchAllResources(company_id)  [reuse from availability.service.js]
    - Fetch existing bookings for time window

[3] Build CSP Problem
    Variables: person_1, person_2, ..., vehicle_1, ..., equipment_1, ...
    Domains: Available resources (pre-filtered by basic type/role matching)
    Constraints: C1-C5 defined above

[4] Solve CSP
    - If using constraint.js: call solve() directly
    - If using OR-Tools: HTTP call to Python microservice
    - Timeout: 30 seconds (return 503 if no solution found in time)
    - Returns: Array of feasible solutions (up to 100 max to avoid overwhelming AI)

[5] Handle No Solutions (422)
    - If CSP returns empty array, generate constraint violation report
    - Optionally: run relaxed CSP (drop one constraint at a time) to suggest alternatives

[6] AI Ranking
    - Fetch historical booking data for involved resources (last 50 bookings)
    - Build context JSON: all solutions + resource metadata + historical data
    - Call OpenAI GPT-4o mini with structured prompt
    - Parse rankings + reasoning

[7] Return Top N Solutions
    - Sort by AI score descending
    - Take top `max_solutions` (default 3)
    - Return with assignments + reasoning + warnings
```

---

## 8. Example Scenarios

### Scenario 1: Simple Case (Few Constraints)

**Request:**
```json
{
  "booking": { "title": "Equipment Delivery", "start_time": "...", "end_time": "..." },
  "requirements": {
    "people": [{ "role": "driver", "skills": ["driving"], "certifications": [], "quantity": 1 }],
    "vehicles": [{ "type": "truck", "min_capacity": null, "quantity": 1 }],
    "equipment": []
  },
  "preferences": { "optimize_for": "cost" }
}
```

**CSP finds:** 8 feasible combinations (3 drivers × 2 trucks with availability)

**AI ranks by cost:**
1. Driver Bob ($25/hr) + Truck T-2 → $200 total
2. Driver Alice ($30/hr) + Truck T-2 → $240 total
3. Driver Alice ($30/hr) + Truck T-5 → $240 total

**Response:** Top 3 with reasoning explaining cost difference.

---

### Scenario 2: Complex Case (Many Constraints)

**Request:**
```json
{
  "requirements": {
    "people": [
      { "role": "welder", "skills": ["welding", "rigging"], "certifications": ["AWS D1.1"], "quantity": 2 },
      { "role": "safety officer", "certifications": ["OSHA 30"], "quantity": 1 }
    ],
    "vehicles": [{ "type": "van", "min_capacity": 10, "quantity": 1 }],
    "equipment": [
      { "type": "welder", "min_condition": "good", "quantity": 2 },
      { "type": "safety harness", "min_condition": "excellent", "quantity": 3 }
    ]
  }
}
```

**CSP challenge:** Must find 2 welders + 1 safety officer + 1 van + 2 welders + 3 harnesses, all available at the same time, all meeting skill/cert/capacity/condition requirements.

**CSP finds:** 3 feasible combinations (tight constraints)

**AI ranks by quality:**
1. Experienced team (worked together 5 times before) + excellent equipment
2. Mixed experience team + good equipment
3. Newer team + excellent equipment

**Reasoning:** AI explains team cohesion, equipment condition, and trade-offs.

---

### Scenario 3: No Feasible Solutions (422)

**Request:** Requires 3 welders with AWS D1.1 cert on a day when only 1 is available.

**CSP finds:** 0 solutions

**Response 422:**
```json
{
  "violated_constraints": [
    "Only 1 available welder with AWS D1.1 certification (need 3)"
  ],
  "suggestions": [
    "Consider splitting the job across 2 days (Feb 17-18) when 2 welders are available each day",
    "Relax certification requirement to include AWS D1.2 — adds 2 more welders to the pool"
  ]
}
```

The AI generates suggestions by analyzing **near-miss solutions** (solutions that violate only one constraint).

---

## 9. Implementation Plan

### Phase 1: CSP Integration (Days 1-3)

**Files to create:**
- `src/services/csp.service.js` — CSP solver wrapper
  - If constraint.js: direct integration
  - If OR-Tools: HTTP client to Python service
- `src/services/csp-constraints.js` — Build CSP problem from booking requirements
- Python microservice (if OR-Tools): `csp-solver/` directory with FastAPI service

**Tasks:**
1. Install `constraint` npm package (or set up Python OR-Tools service)
2. Implement constraint builders (time availability, skills, capacity, condition)
3. Test CSP solver with sample bookings (unit tests with mocked resource data)

### Phase 2: AI Ranking (Days 4-5)

**Files to create:**
- `src/services/optimal-ranking.service.js` — AI ranking logic
  - Fetch historical booking data
  - Build context for AI
  - Call OpenAI with structured prompt
  - Parse and validate AI response

**Tasks:**
1. Design AI prompt for quality/cost/balanced optimization
2. Implement ranking service (separate from ai.service.js)
3. Test with CSP output (mock feasible solutions)

### Phase 3: Controller + Routes (Day 6)

**Files to create:**
- `src/controllers/optimal-scheduling.controller.js` — Orchestrates CSP → AI → response
- `src/routes/optimal-scheduling.routes.js` — `POST /schedule-optimal`

**Tasks:**
1. Input validation
2. Call CSP solver
3. Handle no-solution case (422 with suggestions)
4. Call AI ranking
5. Format response

### Phase 4: Testing (Days 7-8)

**Tests to write:**
- `csp.service.test.js` — CSP constraint building and solving
- `optimal-ranking.service.test.js` — AI ranking with mocked OpenAI
- `optimal-scheduling.controller.test.js` — End-to-end flow with mocked services
- Integration test with real CSP solver + mocked AI

### Phase 5: Documentation + Deployment (Day 9)

- API documentation (this PRD serves as spec)
- Deploy Python OR-Tools service (if used) alongside Express backend
- Environment variables: `OPENAI_API_KEY`, `CSP_SERVICE_URL` (if OR-Tools)

---

## 10. Dependencies

**New npm packages:**
- `constraint` (if using JavaScript CSP solver)

**New services:**
- Python microservice with OR-Tools (if using Python CSP)
  - FastAPI or Flask for REST wrapper
  - Deploy to Railway, Render, or AWS Lambda

**Environment variables:**
```env
OPENAI_API_KEY=sk-proj-...
CSP_SERVICE_URL=http://localhost:5000  # if using OR-Tools Python service
CSP_TIMEOUT_MS=30000                    # CSP solver timeout
```

---

## 11. Advantages of Hybrid Approach

| Aspect | Pure CSP | Pure AI | Hybrid (CSP + AI) |
|--------|----------|---------|-------------------|
| **Constraint guarantee** | ✅ Perfect | ❌ Can hallucinate invalid assignments | ✅ Perfect (CSP handles) |
| **Soft preference optimization** | ⚠️ Hard to encode complex rules | ✅ Excellent at contextual reasoning | ✅ Best of both |
| **Explainability** | ❌ No reasoning, just valid/invalid | ✅ Natural language explanations | ✅ AI explains CSP results |
| **Performance** | ✅ Fast for small problems | ⚠️ Slow, expensive | ⚠️ CSP fast, AI adds latency |
| **Scalability** | ⚠️ Exponential with variables | ⚠️ Token limit on context | ⚠️ CSP limits solutions, AI ranks subset |
| **Cost** | ✅ Free (compute only) | ❌ AI API costs per request | ⚠️ Moderate (AI only on feasible set) |

**Key insight:** CSP filters the solution space to **only valid assignments**. AI ranks a small set of valid options, making AI calls efficient and guaranteeing correctness.

---

## 12. Future Enhancements (Post-MVP)

### P1 — Batch Optimization
- **Feature:** `POST /api/ai/schedule-batch` — Accepts multiple bookings, returns optimal global assignment
- **CSP:** Define variables for all bookings simultaneously, add cross-booking constraints (person can't be in two places)
- **AI:** Rank global solutions by overall efficiency (workload balance, minimize idle time)

### P2 — Learning from User Choices
- Track which AI-ranked solutions users actually select
- Fine-tune ranking weights over time ("users always pick cost over quality for delivery jobs")
- Use historical selection data to bias future rankings

### P3 — Real-Time Re-Optimization
- When a booking is canceled or a resource becomes unavailable, trigger automatic re-scheduling
- CSP finds new feasible assignment, AI explains the changes

### P4 — Multi-Objective Pareto Optimization
- Instead of single `optimize_for`, return Pareto frontier (solutions that are optimal for different objective combinations)
- UI lets user explore trade-off space with sliders

---

## 13. Security & Performance Considerations

**Security:**
- All CSP queries filter by `company_id` (multi-tenant isolation)
- CSP solver runs in isolated process/service (no SQL injection risk)
- AI context includes only company's own data

**Performance:**
- CSP timeout: 30s (return 503 if unsolvable in time)
- Limit CSP output to max 100 feasible solutions (prevent overwhelming AI)
- AI ranking only on top 100 solutions (sorted by CSP-level objective if available)
- Cache CSP results for identical booking requirements (5-minute TTL)

**Cost optimization:**
- For `optimize_for: "cost"`, use CSP's built-in objective function (if OR-Tools) to pre-sort solutions
- Only send top 10 CSP solutions to AI for final ranking (reduces token usage)

---

## 14. Success Metrics

**MVP success criteria:**
- CSP solver finds feasible solutions in <10s for 95% of requests
- AI ranking completes in <5s for top 5 solutions
- User testing shows preference for hybrid suggestions over simple keyword matching
- Zero constraint violations in production (CSP guarantees this)

**Monitoring:**
- Track CSP "no solution found" rate (if high, constraints may be too tight)
- Track AI ranking latency and token usage
- A/B test: Hybrid vs. simple keyword approach — measure booking completion rate
