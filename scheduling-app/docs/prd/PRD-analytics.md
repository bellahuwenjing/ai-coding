# Analytics Plan — SchedulePro MVP

**Date**: 2026-03-01
**Status**: Planned
**Scope**: Post-MVP analytics with minimal implementation effort

---

## What to Measure

Three core questions to answer:

**1. Is anyone using it?**
- Active companies (weekly/monthly)
- Login frequency per company
- Returning vs one-time users

**2. What are they doing?**
- Bookings created per company (core action)
- Resources added (people/vehicles/equipment)
- Which resource types are most booked

**3. Where does it break?**
- API errors by endpoint (4xx, 5xx)
- Failed logins
- Frontend JS errors and crashes

---

## Recommended Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Vercel Analytics + Vercel Speed Insights | Already on Vercel, zero config, free |
| Backend | Custom middleware logging to Supabase | Already have Supabase, no new service |
| Errors | Sentry (free tier) | Captures frontend JS errors and backend crashes |

---

## Implementation Plan

### Step 1 — Frontend: Vercel Analytics (~30 min)

Enable Vercel Analytics in the Vercel dashboard (one click), then:

```bash
cd schpro-frontend
npm install @vercel/analytics @vercel/speed-insights
```

In `main.jsx`:
```jsx
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

inject();
injectSpeedInsights();
```

**What this gives you**: page views, route changes, Web Vitals, visitor geography — all free.

#### Automatic page view tracking

`inject()` auto-tracks every route change in the SPA. No per-component work needed for:

- `/login` — Login page
- `/register` — Register page
- `/bookings` — Bookings list
- `/people` — People list
- `/vehicles` — Vehicles list
- `/equipment` — Equipment list
- `/dashboard` — Dashboard

#### Custom events — component locations

Page views don't capture user actions. Use `track()` from `@vercel/analytics` for these 6 components:

| Component | File | Event name(s) | Trigger point |
|---|---|---|---|
| Register | `src/components/Auth/Register.jsx` | `register` | After `result.success`, before `window.location.reload()` |
| Login | `src/components/Auth/Login.jsx` | `login` | After `result.success`, before `window.location.reload()` |
| BookingForm | `src/components/BookingForm/BookingForm.jsx` | `booking_created` / `booking_updated` | After `await model.save()`, before `onSave()` |
| PersonForm | `src/components/ResourceList/PersonForm.jsx` | `person_created` / `person_updated` | After `await model.save()`, before `onClose()` |
| VehicleForm | `src/components/ResourceList/VehicleForm.jsx` | `vehicle_created` / `vehicle_updated` | After `await model.save()`, before `onClose()` |
| EquipmentForm | `src/components/ResourceList/EquipmentForm.jsx` | `equipment_created` / `equipment_updated` | After `await model.save()`, before `onClose()` |

**Not tracked** (page views sufficient): `BookingsList`, `PeopleList`, `VehiclesList`, `EquipmentList`, `Dashboard`. Delete actions deferred — focus on creation at MVP scale.

#### Custom event code examples

`Register.jsx` and `Login.jsx`:
```jsx
import { track } from '@vercel/analytics';

// after if (result.success):
track('register'); // or 'login'
window.location.reload();
```

`BookingForm.jsx` — includes metadata for resource mix analysis:
```jsx
import { track } from '@vercel/analytics';

await model.save();
track(isEdit ? 'booking_updated' : 'booking_created', {
  people_count: formData.people.length,
  vehicles_count: formData.vehicles.length,
  equipment_count: formData.equipment.length,
});
onSave();
```

`PersonForm.jsx`, `VehicleForm.jsx`, `EquipmentForm.jsx`:
```jsx
import { track } from '@vercel/analytics';

await model.save();
track(isEdit ? 'person_updated' : 'person_created'); // or vehicle_/equipment_
onClose();
```

---

### Step 2 — Backend: Event Logging to Supabase (~2-3 hrs)

#### Database

Create an `analytics_events` table in Supabase:

```sql
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id),
  event_name text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
```

#### Service

Create `src/services/analytics.service.js`:

```js
const { supabase } = require('../config/supabase');

async function track(event_name, company_id, metadata = {}) {
  // Fire-and-forget — never block the request
  supabase.from('analytics_events')
    .insert({ event_name, company_id, metadata })
    .then(() => {})
    .catch(() => {}); // silently fail — never break a request for analytics
}

module.exports = { track };
```

#### Events to Track

Sprinkle `track()` calls in controllers after successful operations:

| Event | Location | Metadata |
|---|---|---|
| `auth.register` | auth.controller — register | — |
| `auth.login` | auth.controller — login | — |
| `booking.created` | booking.controller — create | `{ people_count, vehicles_count, equipment_count }` |
| `booking.deleted` | booking.controller — delete | — |
| `person.created` | people.controller — create | — |
| `vehicle.created` | vehicles.controller — create | — |
| `equipment.created` | equipment.controller — create | — |

Example usage in a controller:

```js
const { track } = require('../services/analytics.service');

// after successful booking create...
await track('booking.created', req.user.company_id, {
  people_count: people.length,
  vehicles_count: vehicles.length,
  equipment_count: equipment.length,
});
```

#### Useful Queries

Active companies in last 7 days:
```sql
SELECT company_id, count(*)
FROM analytics_events
WHERE created_at > now() - interval '7 days'
GROUP BY company_id;
```

Bookings created per day:
```sql
SELECT date_trunc('day', created_at) as day, count(*)
FROM analytics_events
WHERE event_name = 'booking.created'
GROUP BY day
ORDER BY day DESC;
```

---

### Step 3 — Error Monitoring: Sentry (~20 min)

Sign up at sentry.io (free tier), then:

```bash
cd schpro-backend && npm install @sentry/node
cd schpro-frontend && npm install @sentry/react
```

Backend `server.js`:
```js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler()); // before routes
// ... routes ...
app.use(Sentry.Handlers.errorHandler()); // after routes
```

Add `SENTRY_DSN` to backend `.env` and Render environment variables.

---

## Summary: What You Get

| What | Where to see it |
|---|---|
| Page views, routes, Core Web Vitals | Vercel dashboard |
| Bookings/resources created per company | Supabase `analytics_events` table |
| Active companies this week | Supabase query |
| JS errors + backend crashes | Sentry dashboard |

**Total effort**: ~4 hours
**New paid services**: None (all free tiers sufficient for MVP scale)

---

## Deferred (Post-MVP)

- Mixpanel / Amplitude / PostHog — overkill until user volume grows
- Custom analytics dashboard — Supabase direct queries are sufficient for now
- Session recording (FullStory / LogRocket) — not worth cost at MVP scale

---

## Free Tier Limits

| Service | Free Limit |
|---|---|
| Vercel Analytics | 2,500 data points/month |
| Sentry | 5,000 errors/month |
| Supabase | 500 MB database storage |
