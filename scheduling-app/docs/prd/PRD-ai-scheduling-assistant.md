# PRD: AI Smart Scheduling Assistant
## SchedulePro - Natural Language Booking Suggestions (Backend Feature)

---

## 1. Overview

### 1.1 Feature Summary

An AI-powered endpoint that accepts a natural language scheduling request and returns ranked, availability-checked resource suggestions. Users describe what they need in plain English; the API returns the best available people, vehicles, and equipment for the requested time window.

**Primary Endpoint:** `POST /api/ai/suggest`

### 1.2 Problem Statement

Creating a booking currently requires the user to know in advance which specific resources to assign. There is no way to:
- Describe a need in natural language and get resource recommendations
- Check availability across all resource types simultaneously before committing to a booking
- Score resources by how well they match the booking requirements

This feature bridges the gap between "I need a welder and a van on Tuesday" and "here are the available, best-matched resources for that time."

### 1.3 Feature Scope

**In scope:**
- Natural language parsing via OpenAI GPT-4o mini
- Availability checking against existing bookings (people, vehicles, equipment)
- Skill/certification/type matching with scored results
- Single endpoint: `POST /api/ai/suggest`

**Out of scope (future):**
- Auto-creating the booking from suggestions
- Conflict override / approval workflow
- Conversation history / multi-turn assistant
- Recurring booking suggestions
- Timezone-aware scheduling (MVP assumes UTC)

---

## 2. Technical Stack Additions

| Component | Technology | Notes |
|-----------|------------|-------|
| AI Provider | OpenAI API | `gpt-4o-mini` model |
| OpenAI Client | `openai` npm package v4.x | Official Node.js SDK |
| Parsing Mode | JSON mode (`response_format: { type: "json_object" }`) | Enforces structured output |
| Temperature | 0.1 | Low for deterministic extraction |
| New env variable | `OPENAI_API_KEY` | Added to `.env` |

**Why OpenAI GPT-4o mini?**
- Fast and cost-efficient for structured extraction tasks
- Strong relative-date reasoning ("next Tuesday", "this Friday")
- Reliable with explicit JSON schemas in the system prompt
- Widely documented and stable API

### 2.1 AI vs. Algorithmic Approach (Technical Clarification)

**What AI actually does in this design:**

AI is **only** responsible for **natural language parsing** — converting unstructured user input into a structured JSON object with `title`, `start_time`, `end_time`, and `requirements`. This is a single OpenAI API call.

**What pure code (non-AI algorithms) does:**

Everything else is traditional programming:

1. **Availability checking** — SQL time overlap query:
   ```sql
   WHERE bookings.start_time < requested_end_time
     AND bookings.end_time > requested_start_time
   ```
   Returns IDs of booked resources; the rest are marked as available. This is standard database querying.

2. **Scoring/matching** — Simple keyword-based arithmetic:
   - **People**: Count how many required skills appear in the person's `skills[]` array → `(matched_skills / total_required) × 40 points`
   - **Vehicles**: Check if type keyword ("van", "truck") appears as substring in `name`, `make`, `model`, or `notes` → up to 70 points
   - **Equipment**: Same keyword matching for `type` field + condition quality weighting

   This is basic **substring matching** and **weighted scoring**, not sophisticated matching.

3. **Ranking** — JavaScript array sort: available resources first, then by `match_score` descending.

**Why this matters:**

This design is **AI-light**. The "intelligence" in resource matching is minimal — it's keyword search with a scoring formula. The AI layer adds natural language convenience but doesn't power the core matching logic.

---

**Alternative approaches (more sophisticated):**

### Option A: Constraint Satisfaction Programming (CSP)

**What is CSP?**
Constraint Satisfaction Programming solves optimization problems by defining:
- **Variables**: Which person/vehicle/equipment to assign to each booking
- **Domains**: All available resources per variable
- **Constraints**: Time conflicts, skill requirements, capacity limits, budget caps, workload balancing
- **Objective**: Minimize cost, maximize utilization, or satisfy other business rules

CSP solvers (e.g., Google OR-Tools, `constraint` npm package) find optimal assignments that satisfy all constraints.

**Where CSP makes sense:**
- **Batch scheduling** — "I have 10 jobs next week; auto-assign all resources optimally"
- **Conflict resolution** — "Resource A is unavailable; find minimal reassignments to fix all conflicts"
- **Global optimization** — "Schedule 50 bookings to minimize total labor cost and balance workload across staff"

**Why this design doesn't use CSP:**
The `suggest` endpoint handles **one booking at a time**, not multi-booking optimization. CSP is overkill for "show me available resources for this single request." CSP would be appropriate for a future feature like **"Auto-Schedule All Pending Jobs"** or **"Optimize This Week's Schedule."**

---

### Option B: Semantic Matching via AI Embeddings

Instead of keyword matching, use **vector embeddings** to find semantically similar skills/requirements:

1. Embed all skills, certifications, vehicle types, equipment types into vector space (via OpenAI embeddings API or similar)
2. Embed the user's requirements
3. Use **cosine similarity** to find matches

**Example benefit:**
"CDL Class A license" semantically matches "commercial truck driver" even though they share no keywords.

**Why this is genuinely AI-native:**
Captures semantic meaning, handles synonyms and implicit relationships. This is what AI does well that keyword search cannot.

**Trade-offs:**
- Slower (embedding API calls or local model inference)
- Requires vector storage or runtime embedding generation
- More sophisticated but adds complexity

---

### Option C: AI-Powered Scoring with Contextual Reasoning

Instead of hardcoded scoring formulas, send the full context (all available resources, booking requirements, historical booking data) to the LLM and ask it to **score and rank resources with reasoning**.

**Example:**
```
"Alice: 95/100 — Holds required welding certification and was assigned to 4 similar
bridge inspection jobs in the past 6 months with no reported issues. Note: she has
a 30-minute gap before a 3pm job; verify travel time from the bridge site."
```

**Why this is genuinely AI-native:**
The LLM can consider subtle factors (travel time between jobs, historical performance, certification expiry dates, workload fatigue) that are hard to encode in fixed rules.

**Trade-offs:**
- Expensive (one LLM call per resource or one large context call)
- Slower (LLM inference time)
- Less predictable (AI reasoning can vary)

---

### Option D: Hybrid Approach

Combine CSP for **constraint satisfaction** with AI for **interpretation and explanation**:

1. Use CSP to find all feasible resource assignments that satisfy hard constraints
2. Use AI to rank/explain them in natural language with business context

This leverages the strengths of both: CSP for optimization, AI for communication.

---

**Current MVP decision:**

The PRD as written uses **keyword matching + arithmetic scoring** (simple, fast, predictable). AI is only used for natural language parsing. This is sufficient for MVP but is not a sophisticated scheduling algorithm.

**Future enhancement paths:**
- Upgrade to **semantic embeddings** (Option B) for better skill matching
- Add **CSP-based batch scheduling** (Option A) for multi-booking optimization
- Use **AI for contextual scoring** (Option C) to capture nuanced factors

---

## 3. New Files

```
schpro-backend/src/
├── controllers/
│   └── ai.controller.js            # Orchestrates the suggest flow
├── routes/
│   └── ai.routes.js                # POST /suggest, protected by verifyToken
├── services/
│   ├── ai.service.js               # OpenAI client + parseSchedulingIntent()
│   ├── availability.service.js     # DB queries: fetch resources, check booked IDs
│   └── scoring.service.js          # Pure scoring/ranking logic (no I/O)
└── __tests__/
    ├── controllers/
    │   └── ai.controller.test.js
    └── services/
        ├── availability.service.test.js
        └── scoring.service.test.js
```

**Modified files:**
- `src/app.js` — register `ai.routes` under `/api/ai`
- `package.json` — add `openai` dependency
- `.env` — add `OPENAI_API_KEY`

---

## 4. API Specification

### 4.1 POST /api/ai/suggest

**Authentication:** Required (`Authorization: Bearer <token>`)

**Request Body:**

```json
{
  "message": "I need a van and a certified welder for a bridge inspection next Tuesday from 9am to 5pm",
  "context_date": "2026-02-12"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `message` | string | Yes | Natural language scheduling request. Max 500 characters. |
| `context_date` | string (ISO date) | No | Today's date for resolving relative expressions like "next Tuesday". Defaults to server date if omitted. |

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "parsed_intent": {
      "title": "Bridge Inspection",
      "start_time": "2026-02-17T09:00:00Z",
      "end_time": "2026-02-17T17:00:00Z",
      "requirements": {
        "people": [
          { "role": "welder", "skills": ["welding"], "certifications": ["welding"] }
        ],
        "vehicles": [
          { "type": "van", "min_capacity": null }
        ],
        "equipment": []
      }
    },
    "suggestions": {
      "people": [
        {
          "id": "uuid",
          "name": "Alice Johnson",
          "skills": ["welding", "grinding"],
          "certifications": ["AWS D1.1"],
          "available": true,
          "match_score": 80
        }
      ],
      "vehicles": [
        {
          "id": "uuid",
          "name": "Ford Transit Van",
          "make": "Ford",
          "model": "Transit",
          "capacity": 8,
          "available": true,
          "match_score": 100
        }
      ],
      "equipment": []
    },
    "summary": "Found 1 available person and 1 available vehicle for Bridge Inspection on Tuesday, Feb 17."
  }
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | `message` field is missing, empty, or exceeds 500 characters |
| 400 | `company_id` not present on token (auth issue) |
| 422 | AI could not parse a valid date/time from the message |
| 422 | Parsed `end_time` is not after `start_time` |
| 422 | No available resources found for any requested resource type in the time window |
| 503 | OpenAI API call failed or is unavailable |
| 500 | Unexpected internal server error |

**Error response format:**
```json
{
  "status": "error",
  "message": "No available resources found for the requested time. Consider shifting the time window."
}
```

---

## 5. Processing Flow

```
Request → Input Validation
        → parseSchedulingIntent() [OpenAI GPT-4o mini]
        → Validate parsed times
        → fetchAllResources() + fetchBookedIds() [parallel Supabase queries]
        → applyAvailability()
        → scoreAndRankResources()
        → Availability guard check
        → Return 200 with suggestions
```

### 5.1 Step 1 — Input Validation

- `message` must be a non-empty string, max 500 characters
- `company_id` must be present on `req.user`

### 5.2 Step 2 — AI Intent Parsing (`ai.service.js`)

Calls `gpt-4o-mini` with:
- System prompt containing today's date (or `context_date`) for relative date resolution
- Explicit JSON schema in the system prompt — returns `title`, `start_time`, `end_time`, `requirements`
- `response_format: { type: "json_object" }` to enforce valid JSON
- `temperature: 0.1` for deterministic extraction
- `max_tokens: 500`

The model infers skill/certification keywords from role descriptions (e.g. "certified welder" → `skills: ["welding"], certifications: ["welding"]`).

**OpenAI failures** throw with `err.isAIError = true` so the controller returns 503 specifically for AI failures, distinct from DB or logic errors.

### 5.3 Step 3 — Validate Parsed Times

Before touching the database:
- Both `start_time` and `end_time` must be parseable as valid dates
- `end_time` must be after `start_time`
- Returns 422 with a clear message if either check fails

### 5.4 Step 4 — Availability Queries (`availability.service.js`)

Two functions run in `Promise.all` (parallel, independent):

**`fetchAllResources(companyId)`**
- Three parallel Supabase queries for `people`, `vehicles`, `equipment`
- All filtered by `company_id` and `is_deleted = false`

**`fetchBookedIds(companyId, startTime, endTime)`**
- **Step A** — Find overlapping booking IDs:
  ```
  .from('bookings')
  .eq('company_id', companyId)
  .eq('is_deleted', false)
  .lt('start_time', endTime)   ← existing booking starts before our end
  .gt('end_time', startTime)   ← existing booking ends after our start
  ```
  This is the standard half-open interval overlap condition.
- **Step B** — For each junction table, `.in('booking_id', bookingIds)` to get booked resource IDs
- Returns `{ bookedPersonIds: Set, bookedVehicleIds: Set, bookedEquipmentIds: Set }`

**`applyAvailability(resources, bookedIds)`**
- Maps each resource with `available: !bookedIds.has(resource.id)`

### 5.5 Step 5 — Scoring (`scoring.service.js`)

Pure functions (no I/O). Each resource is assigned a `match_score` 0–100.

**People scoring:**

| Component | Max pts | Logic |
|-----------|---------|-------|
| Skills match | 40 | `(matched_skills / required_skills) × 40` |
| Certifications match | 40 | `(matched_certs / required_certs) × 40` |
| Role keyword match | 20 | Binary: role token appears in person's name or skills |
| No requirements | 100 | Any person scores 100 when no requirements specified |

Matching is case-insensitive substring (`includes`) to handle partial strings like "AWS D1.1" matching "welding" loosely.

**Vehicle scoring:**

| Component | Max pts | Logic |
|-----------|---------|-------|
| Type token match | 70 | Tokens from `type` keyword matched across `name`, `make`, `model`, `notes` |
| Capacity match | 30 | Full 30 if `capacity >= min_capacity`; full 30 if no capacity required; 0 if insufficient |

**Equipment scoring:**

| Component | Max pts | Logic |
|-----------|---------|-------|
| Type token match | 60 | Tokens matched across `name`, `type`, `notes` |
| Condition | 40 | Exact condition match = 40; if no condition required, scaled by quality (excellent=100, good=75, fair=50, poor=25) |

**Sort order within each resource type:**
1. `available: true` before `available: false` (always)
2. Within same availability group: higher `match_score` first

This means the response always shows the best available matches first, while still including unavailable resources (so the UI can optionally show "better match but currently booked").

### 5.6 Step 6 — Availability Guard

For each resource type that the user requested (non-empty requirements array), at least one available resource must exist. If a requested type has zero available resources, return 422.

Resource types with empty requirements are not checked (e.g. no vehicles requested → don't block on vehicle availability).

---

## 6. Data Contracts

### 6.1 parsed_intent object

```typescript
{
  title: string;              // 2-4 word task description, Title Case
  start_time: string;         // ISO 8601 UTC (e.g. "2026-02-17T09:00:00Z")
  end_time: string;           // ISO 8601 UTC
  requirements: {
    people: Array<{
      role?: string;          // job title/role keyword
      skills?: string[];      // skill keywords
      certifications?: string[];
    }>;
    vehicles: Array<{
      type?: string;          // vehicle type keyword (van, truck, etc.)
      min_capacity?: number;
    }>;
    equipment: Array<{
      type?: string;          // equipment type keyword
      condition?: string[];   // acceptable conditions: excellent|good|fair|poor
    }>;
  };
}
```

### 6.2 suggestion item (people)

```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skills: string[];
  certifications: string[];
  hourly_rate: number | null;
  available: boolean;         // false if already booked in the time window
  match_score: number;        // 0-100
}
```

### 6.3 suggestion item (vehicles)

```typescript
{
  id: string;
  name: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  notes: string | null;
  available: boolean;
  match_score: number;
}
```

### 6.4 suggestion item (equipment)

```typescript
{
  id: string;
  name: string;
  serial_number: string;
  type: string | null;
  condition: "excellent" | "good" | "fair" | "poor" | null;
  notes: string | null;
  available: boolean;
  match_score: number;
}
```

---

## 7. Feature Prioritization

### P0 — MVP (this feature)

- [x] `POST /api/ai/suggest` endpoint
- [x] Natural language intent parsing (OpenAI GPT-4o mini, JSON mode)
- [x] Relative date resolution via `context_date`
- [x] Availability checking (all three resource types, junction table queries)
- [x] Match scoring (people by skills/certs, vehicles by type/capacity, equipment by type/condition)
- [x] Available-first sort with `match_score`
- [x] 503 response on OpenAI failure (graceful degradation)
- [x] 422 response when no available resources match
- [x] Human-readable `summary` string in response

### P1 — Post-MVP Enhancements

- [ ] **One-click booking creation** — `confirm: true` flag on the suggest body auto-creates the booking from the top-ranked suggestions
- [ ] **Timezone support** — Pass company timezone in prompt; return times in local timezone alongside UTC
- [ ] **Multi-requirement matching** — Support multiple people/vehicles with different requirements in one request (e.g. "a welder AND a driver")
- [ ] **Conversation history** — Multi-turn refinement ("make it a full day instead", "swap the van for a truck")
- [ ] **AI response caching** — Cache identical `message` + `context_date` + company resource snapshot for 5 minutes to reduce OpenAI costs

### P2 — Future

- [ ] **Conflict-aware alternative suggestions** — When no resources are available, suggest the nearest alternative time window that has availability
- [ ] **Historical pattern learning** — Weight scoring based on which resources have been assigned to similar past bookings
- [ ] **Budget-aware suggestions** — Filter or rank by `hourly_rate` within a cost constraint
- [ ] **Provider abstraction** — Swap OpenAI for Anthropic Claude or local models via a provider interface

---

## 8. Error Handling Summary

| Scenario | HTTP Status | Message |
|----------|-------------|---------|
| Missing `message` field | 400 | "message field is required" |
| Empty message | 400 | "message field cannot be empty" |
| Message > 500 chars | 400 | "message field must be 500 characters or fewer" |
| Missing `company_id` on token | 400 | "Company ID not found. Please login again." |
| AI cannot parse valid times | 422 | "Could not parse a valid date/time from your request. Please specify a date and time." |
| Parsed `end_time <= start_time` | 422 | "Parsed end time is not after start time. Please clarify the time range." |
| No available resources for requested type | 422 | "No available resources found for the requested time. Consider shifting the time window." |
| OpenAI API error / timeout | 503 | "AI service is temporarily unavailable. Please try again." |
| Supabase query failure | 500 | "Internal server error" |

---

## 9. Security Considerations

- Endpoint is protected by `verifyToken` middleware — unauthenticated requests return 401
- All DB queries filter by `req.user.company_id` — no cross-tenant data exposure
- `message` input is passed directly to OpenAI as user content (not executed as code) — prompt injection risk is low but noted
- `OPENAI_API_KEY` stored in `.env`, never exposed in responses or logs
- Max 500 character input limit caps OpenAI token usage per request

---

## 10. Testing Requirements

### Unit Tests

**`scoring.service.test.js`** (no mocks needed — pure logic):
- Person with matching skills/certs scores higher than non-matching
- Person with no requirements scores 100
- Vehicle type match awards type points; capacity shortfall removes capacity points
- Equipment condition quality affects score when no condition required
- `scoreAndRankResources` sorts available before unavailable; higher score first within availability group

**`availability.service.test.js`** (mocked Supabase):
- Returns empty Sets when no overlapping bookings exist
- Correctly identifies booked person/vehicle/equipment IDs through junction tables
- `applyAvailability` marks resources as unavailable when their ID is in the booked set

**`ai.controller.test.js`** (mocked services):
- Returns 400 for missing/empty/too-long message
- Returns 400 for missing company_id
- Returns 503 when `parseSchedulingIntent` throws
- Returns 200 with correct shape on happy path
- Passes `context_date` through to `parseSchedulingIntent`
- Returns 422 when no available resources match requested types

### Integration Test (manual)

1. Start server: `npm run dev` in `schpro-backend`
2. Register + login → get JWT
3. `POST /api/ai/suggest` with a natural language message
4. Verify 200 with `parsed_intent.title`, `suggestions`, `summary`
5. Create bookings that occupy specific resources
6. Re-run same suggest → verify those resources show `available: false`
7. Book all resources of a requested type → verify 422 response
8. Send request with no `OPENAI_API_KEY` set → verify 503 response

---

## 11. Environment Configuration

```env
# Add to schpro-backend/.env
OPENAI_API_KEY=sk-proj-...your-key-here...
```

The OpenAI client is lazy-initialized: if `OPENAI_API_KEY` is missing, the error is thrown at call time (not at server startup), so tests that mock `ai.service.js` continue to work without the env variable set.
