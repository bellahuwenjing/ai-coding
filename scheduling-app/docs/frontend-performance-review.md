# Frontend Performance Review

**Date:** 2026-02-26
**Reviewed by:** Claude Code (react-best-practices skill)
**Scope:** `schpro-frontend` (React + Vite + Backbone.js) and `landing-page` (Next.js)

---

## Summary

The codebase is well-structured for an MVP but has several performance issues that will become more impactful as data volume and user load grow. Issues are ranked below by impact level.

---

## Critical Issues

### 1. Sequential API Calls (Waterfall) — CRITICAL

**Files:** `schpro-frontend/src/components/BookingForm/BookingForm.jsx`, `BookingsList/BookingsList.jsx`

Every `useEffect` triggers 3–4 fetches sequentially. Each call waits for the previous to complete before starting — a classic waterfall.

```js
// ❌ Current: sequential waterfall (+3× network latency)
useEffect(() => {
  peopleCollection.fetch()
  vehiclesCollection.fetch()
  equipmentCollection.fetch()
}, [])

// ✅ Fix: parallel with Promise.all
useEffect(() => {
  Promise.all([
    peopleCollection.fetch(),
    vehiclesCollection.fetch(),
    equipmentCollection.fetch()
  ]).catch(err => console.error(err))
}, [])
```

**Impact:** Reduces total fetch time from `latency × 3` to `max(latency)` — up to 3× faster data load.

---

### 2. O(n×m) Resource Lookup Per Render — HIGH

**File:** `schpro-frontend/src/components/BookingsList/BookingsList.jsx` — `getResourceNames()`

This function is called on every render for every booking. With 100 bookings and 10 resources each, that's **1,000 `.find()` operations per render**.

```js
// ❌ Current: O(n×m) — linear scan inside render
const getResourceNames = (ids, collection) =>
  ids.map(id => collection.find(m => m.id === id)?.get('name')).join(', ')

// ✅ Fix: build O(1) index maps with useMemo
const peopleMap = useMemo(
  () => Object.fromEntries(people.map(p => [p.id, p.get('name')])),
  [people]
)
const vehiclesMap = useMemo(
  () => Object.fromEntries(vehicles.map(v => [v.id, v.get('name')])),
  [vehicles]
)
const equipmentMap = useMemo(
  () => Object.fromEntries(equipment.map(e => [e.id, e.get('name')])),
  [equipment]
)

// Usage: ids.map(id => peopleMap[id] ?? `Unknown (${id})`).join(', ')
```

**Impact:** Eliminates render-blocking O(n×m) lookups; scales cleanly to large datasets.

---

### 3. No Lazy Loading for Heavy Components — HIGH

**File:** `schpro-frontend/src/App.jsx`

`BookingForm` (321 lines + 3 sub-components + 3 Backbone collections) is eagerly imported and parsed on initial load, even if the user never opens the booking form. Same applies to all tab views.

```js
// ❌ Current: all views eagerly imported
import BookingForm from './components/BookingForm/BookingForm'
import PeopleList from './components/ResourceList/PeopleList'
import VehiclesList from './components/ResourceList/VehiclesList'
import EquipmentList from './components/ResourceList/EquipmentList'
import BookingsList from './components/BookingsList/BookingsList'

// ✅ Fix: lazy-load all tab views
import { lazy, Suspense } from 'react'

const BookingForm   = lazy(() => import('./components/BookingForm/BookingForm'))
const PeopleList    = lazy(() => import('./components/ResourceList/PeopleList'))
const VehiclesList  = lazy(() => import('./components/ResourceList/VehiclesList'))
const EquipmentList = lazy(() => import('./components/ResourceList/EquipmentList'))
const BookingsList  = lazy(() => import('./components/BookingsList/BookingsList'))

// Wrap renderView() output:
<Suspense fallback={<LoadingSpinner />}>
  {renderView()}
</Suspense>
```

**Impact:** Reduces initial bundle size; only loads code for the active tab.

---

### 4. `'use client'` on Landing Page — HIGH

**File:** `landing-page/app/(public-pages)/page.jsx`

The `'use client'` directive at the page level forces the **entire page and all 8 imported sections** into the client bundle. This blocks Server-Side Rendering benefits and inflates Time to Interactive (TTI) and Largest Contentful Paint (LCP).

```js
// ❌ Current: entire page is a client component
'use client'
import HeroSection from '@/sections/hero-section'
import PricingPlans from '@/sections/pricing-plans'  // heavy, below fold
import Testimonials from '@/sections/testimonials'
// ...

// ✅ Fix: remove 'use client' from page.jsx entirely
// Let it be a Server Component — move 'use client' to individual
// sections that actually need browser APIs.
// For below-fold sections, use dynamic imports:
import dynamic from 'next/dynamic'

const PricingPlans = dynamic(() => import('@/sections/pricing-plans'))
const Testimonials = dynamic(() => import('@/sections/testimonials'))
const FaqSection   = dynamic(() => import('@/sections/faq-section'))
```

**Impact:** Improves LCP by streaming above-fold content (HeroSection) while deferring heavy below-fold sections.

---

## Medium Issues

### 5. Unstable Function References from `useBackboneCollection` — MEDIUM

**File:** `schpro-frontend/src/hooks/useBackboneCollection.js`

`fetch`, `add`, and `remove` are plain functions recreated on every render. Any component using them in a `useCallback` or `useEffect` dependency array will see stale or constantly-changing references.

```js
// ❌ Current: new function instances every render
const fetch = (options) => collection.fetch(options)
const add   = (models, options) => collection.add(models, options)
const remove = (models, options) => collection.remove(models, options)

// ✅ Fix: stable references with useCallback
const fetch  = useCallback((options) => collection.fetch(options), [collection])
const add    = useCallback((models, options) => collection.add(models, options), [collection])
const remove = useCallback((models, options) => collection.remove(models, options), [collection])
```

**Impact:** Prevents unnecessary re-renders in consumers; fixes potential stale-closure bugs.

---

### 6. Auth State Not in React State — MEDIUM

**File:** `schpro-frontend/src/App.jsx`

`isAuthenticated` and `currentUser` are read from `localStorage` directly during render. React won't re-render if these values change (e.g., token expiry, refresh), leading to stale UI.

```js
// ❌ Current: localStorage read in render body — won't trigger re-render
const isAuthenticated = authService.isAuthenticated()
const currentUser = authService.getCurrentUser()

// ✅ Fix: manage auth state in React
const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated())
const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser())

// Update on login/logout:
const handleLoginSuccess = () => {
  setIsAuthenticated(true)
  setCurrentUser(authService.getCurrentUser())
}

const handleLogout = async () => {
  await authService.logout()
  setIsAuthenticated(false)
  setCurrentUser(null)
  // Remove window.location.reload() — no longer needed
}
```

**Impact:** Eliminates the `window.location.reload()` hack on logout; enables reactive auth state.

---

## Summary Table

| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | Sequential fetch waterfall | `BookingForm.jsx`, `BookingsList.jsx` | **CRITICAL** | `Promise.all()` |
| 2 | O(n×m) lookup per render | `BookingsList.jsx` | **HIGH** | `useMemo` index maps |
| 3 | No lazy loading for tab views | `App.jsx` | **HIGH** | `React.lazy` + Suspense |
| 4 | `'use client'` on landing page | `landing-page/page.jsx` | **HIGH** | Server Component + `dynamic()` |
| 5 | Unstable hook function refs | `useBackboneCollection.js` | **MEDIUM** | `useCallback` |
| 6 | Auth state outside React | `App.jsx` | **MEDIUM** | `useState` for auth |

---

## Recommended Fix Order

1. **Issue 1** — `Promise.all()` is a 3-line change with immediate visible impact on load time.
2. **Issue 2** — Add `useMemo` index maps before the booking list grows large.
3. **Issue 3** — Add `React.lazy` to `App.jsx`; trivial change, reduces initial parse time.
4. **Issue 4** — Landing page: remove `'use client'` from `page.jsx`, push it down to leaf components.
5. **Issues 5 & 6** — Lower urgency, but fix before adding more hooks that depend on `useBackboneCollection`.
