# Phase 6 & 7 Prerequisites — Implementation Notes

**Date:** February 26, 2026
**Related plan:** `docs/ai-scheduling-implementation-plan.md` (Phases 6 & 7)

---

## What Was Implemented

These are the prerequisite changes required before Phase 6 (Travel Time / Distance-Aware Scheduling) and Phase 7 (Intelligent Constraint Relaxation) can be built. They do not implement the agent features themselves — they lay the data and UI foundation.

---

### 1. Database Migration

**File created:** `schpro-backend/migrations/004_add_home_address_to_people.sql`

```sql
ALTER TABLE people ADD COLUMN home_address TEXT;
```

> **Action required:** Run this manually in the Supabase SQL editor before testing.
> Dashboard → SQL Editor → paste and run the migration file contents.

**Why:** The Phase 6 travel time agent needs a person's home address to call the Maps API. Without this column, the address has nowhere to be stored.

---

### 2. Backend — `people.controller.js`

**Changes in `create` handler:**
- Added `home_address` to request body destructuring
- Added `home_address: home_address || null` to `insertData`

**Changes in `update` handler:**
- Added `home_address` to request body destructuring
- Added `home_address: home_address || null` to `updateData`

No validation added — the field is optional. A missing or empty address is stored as `null`, and the Phase 6 agent will gracefully skip the travel time factor for that person.

---

### 3. Frontend Model — `Person.js`

**Change:** Added `home_address: ''` to `defaults`.

This ensures the field is always present on Person model instances, preventing `undefined` from being sent to the API when the field is not filled in.

---

### 4. Frontend Form — `PersonForm.jsx`

Three changes:

**`formData` initial state:** Added `home_address: ''`

**Edit-mode `useEffect`:** Added `home_address: person.get('home_address') || ''` so existing values are loaded when editing a person.

**New input field** added between Phone and Skills:
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
    placeholder="e.g. 123 Main St, San Francisco, CA 94105"
  />
</div>
```

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `migrations/004_add_home_address_to_people.sql` | New file | ALTER TABLE migration |
| `src/controllers/people.controller.js` | Modified | `home_address` in create + update |
| `src/models/Person.js` (frontend) | Modified | `home_address` in defaults |
| `src/components/ResourceList/PersonForm.jsx` | Modified | State, useEffect, input field |

---

## What Is NOT Yet Implemented

These remain as Phase 6 and 7 work:

| Feature | Phase | Status |
|---|---|---|
| `maps.service.js` — Google Maps API wrapper | 6 | Not started |
| Agent loop in `ai-ranking.service.js` with `get_travel_time` tool | 6 | Not started |
| `GOOGLE_MAPS_API_KEY` env var | 6 | Not added |
| `@googlemaps/google-maps-services-js` npm package | 6 | Not installed |
| `constraint-relaxation.service.js` — iterative relaxation agent | 7 | Not started |
| `checkFeasibility()` export from `scheduler.service.js` | 7 | Not started (file doesn't exist yet — built in Phase 1 MVP) |

---

## Testing Checklist (after running migration)

- [ ] Create a new person with a home address — verify it saves and appears on reload
- [ ] Edit an existing person — verify the home address field is pre-populated
- [ ] Save a person without a home address — verify `null` is stored, no error
- [ ] GET `/api/people` response includes `home_address` field for all people
