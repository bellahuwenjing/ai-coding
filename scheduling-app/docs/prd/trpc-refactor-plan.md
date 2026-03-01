# tRPC Refactor Plan — SchedulePro

## Context

The current architecture uses a hand-rolled REST API (Express.js) with a Backbone.js data layer on the frontend connected via Axios. There is no shared type safety: input validation is manual in every controller, API response shapes are undocumented, and the Backbone models/collections add significant boilerplate while solving a problem (data sync) that React Query handles better. Introducing tRPC replaces the REST layer with typed remote procedures, shared automatically between backend and frontend via TypeScript inference. This eliminates the Backbone layer entirely and replaces manual validation with Zod schemas.

**This refactor includes:**
- TypeScript migration (both sides — required for tRPC type inference to work)
- Backbone.js full removal (replaced by tRPC + React Query)
- Zod validation replacing manual req.body checks in controllers
- Vite path alias for type sharing without monorepo restructure (keeps Vercel + Render deployments independent)
- Legacy file cleanup

---

## Target Package Versions

```
@trpc/server@11        @trpc/client@11        @trpc/react-query@11
@tanstack/react-query@5   zod@3   typescript@5
```

---

## New File Structure

### Backend (`schpro-backend/src/`)
```
server.ts
app.ts
trpc/
  init.ts          ← initTRPC.context<Context>(); publicProcedure, protectedProcedure
  context.ts       ← createContext(): extract JWT → verify with Supabase → attach company_id
  router.ts        ← appRouter = mergeRouters(...); export type AppRouter
  routers/
    auth.router.ts
    people.router.ts
    vehicles.router.ts
    equipment.router.ts
    bookings.router.ts
services/
  supabase.service.ts   ← unchanged (just renamed)
```

### Frontend (`schpro-frontend/src/`)
```
main.tsx             ← + QueryClientProvider + trpc.Provider
App.tsx
trpc.ts              ← createTRPCReact<AppRouter>() + httpBatchLink with auth token
components/          ← same structure; components switched to trpc.* hooks
services/
  auth.ts            ← keep (login/register/logout localStorage management)
```

---

## Files to DELETE

### Backend (replace routes + controllers with tRPC routers)
- `src/routes/` — entire directory (5 files)
- `src/controllers/` — entire directory (5 files)
- `src/middleware/auth.middleware.js` — replaced by `trpc/context.ts`

### Frontend (remove Backbone layer entirely)
- `src/models/` — Person.js, Vehicle.js, Equipment.js, Booking.js
- `src/collections/` — PeopleCollection.js, VehiclesCollection.js, EquipmentCollection.js, BookingsCollection.js
- `src/hooks/useBackboneModel.js`
- `src/hooks/useBackboneCollection.js`
- `src/services/backboneSync.js`
- `src/services/api.js` (Axios wrapper — tRPC client replaces this)
- `src/services/mockAuth.js` (unused stub)
- `src/config/supabase.js` (unused)
- `src/router/`, `src/utils/`, `src/views/` (all empty)

### Frontend packages to remove
```
backbone   underscore   axios   @supabase/supabase-js
```

---

## Implementation Phases

### Phase 1 — Type Sharing via Path Alias

The frontend needs the `AppRouter` type from the backend for end-to-end type inference. Since Vercel and Render build independently, npm workspaces won't work — Vercel only sees `schpro-frontend/`. Instead, use a TypeScript path alias pointing directly at the backend router file.

Because it's an `import type` statement, esbuild (Vite's bundler) erases it at build time — nothing from the backend is ever bundled into the frontend. It's purely a TypeScript dev-time resolution.

**Update `schpro-frontend/tsconfig.json`** to add `paths`:
```json
{
  "compilerOptions": {
    "paths": {
      "schpro-backend": ["../schpro-backend/src/trpc/router.ts"]
    }
  }
}
```

**Update `schpro-frontend/vite.config.ts`** to add the alias (so Vite's language server also resolves it):
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'schpro-backend': path.resolve(__dirname, '../schpro-backend/src/trpc/router.ts'),
    },
  },
  // ... rest of config
})
```

Frontend imports the type via:
```typescript
import type { AppRouter } from 'schpro-backend'
```

No root-level `package.json` needed. Each package installs and builds independently.

---

### Phase 2 — Backend: TypeScript + tRPC

**2a. Install packages:**
```bash
cd schpro-backend
npm install @trpc/server zod
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon
```

**2b. Add `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Update scripts: `"dev": "nodemon --exec ts-node src/server.ts"`

**2c. Create `src/trpc/context.ts`:**
```typescript
import { supabaseAuth, supabaseAdmin } from '../services/supabase.service'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'

export async function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return { user: null }

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return { user: null }

  const { data: person } = await supabaseAdmin
    .from('people')
    .select('id, company_id')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (!person) return { user: null }
  return { user: { id: user.id, email: user.email!, company_id: person.company_id, person_id: person.id } }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

**2d. Create `src/trpc/init.ts`:**
```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.user } })
})
```

**2e. Create routers (example: `src/trpc/routers/people.router.ts`):**
```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../init'
import { supabaseAdmin } from '../../services/supabase.service'
import { TRPCError } from '@trpc/server'

const personSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  home_address: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hourly_rate: z.number().optional(),
})

export const peopleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseAdmin
      .from('people').select('*')
      .eq('company_id', ctx.user.company_id).eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
    return data
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data } = await supabaseAdmin.from('people').select('*')
        .eq('id', input.id).eq('company_id', ctx.user.company_id).eq('is_deleted', false).single()
      if (!data) throw new TRPCError({ code: 'NOT_FOUND' })
      return data
    }),

  create: protectedProcedure.input(personSchema).mutation(async ({ ctx, input }) => {
    const { data, error } = await supabaseAdmin.from('people')
      .insert({ ...input, company_id: ctx.user.company_id }).select().single()
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
    return data
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).merge(personSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input
      const { data } = await supabaseAdmin.from('people')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id).eq('company_id', ctx.user.company_id).select().single()
      if (!data) throw new TRPCError({ code: 'NOT_FOUND' })
      return data
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data } = await supabaseAdmin.from('people')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', input.id).eq('company_id', ctx.user.company_id).select().single()
      if (!data) throw new TRPCError({ code: 'NOT_FOUND' })
      return data
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data } = await supabaseAdmin.from('people')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', input.id).eq('company_id', ctx.user.company_id).select().single()
      if (!data) throw new TRPCError({ code: 'NOT_FOUND' })
      return data
    }),
})
```

Vehicles and equipment follow the identical pattern. Bookings router includes an additional `input` array for `people`, `vehicles`, `equipment` IDs and handles junction table inserts in a single mutation.

**2f. Create `src/trpc/router.ts`:**
```typescript
import { router } from './init'
import { authRouter } from './routers/auth.router'
import { peopleRouter } from './routers/people.router'
import { vehiclesRouter } from './routers/vehicles.router'
import { equipmentRouter } from './routers/equipment.router'
import { bookingsRouter } from './routers/bookings.router'

export const appRouter = router({
  auth: authRouter,
  people: peopleRouter,
  vehicles: vehiclesRouter,
  equipment: equipmentRouter,
  bookings: bookingsRouter,
})

export type AppRouter = typeof appRouter
```

**2g. Update `src/app.ts`:**
```typescript
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './trpc/router'
import { createContext } from './trpc/context'

// Mount tRPC at /api/trpc (replaces all /api/* REST routes)
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }))

// Keep health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))
```

---

### Phase 3 — Frontend: TypeScript + tRPC Client

**3a. Install packages:**
```bash
cd schpro-frontend
npm install @trpc/client @trpc/react-query @tanstack/react-query
npm install -D typescript @types/react @types/react-dom
npm uninstall backbone underscore axios @supabase/supabase-js
```

**3b. Add `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**3c. Create `src/trpc.ts`:**
```typescript
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from 'schpro-backend' // resolved via tsconfig path alias → ../schpro-backend/src/trpc/router.ts

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/trpc`,
      headers() {
        const token = localStorage.getItem('auth_token')
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})
```

**3d. Update `src/main.tsx`:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, trpcClient } from './trpc'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
)
```

---

### Phase 4 — Component Migration

**Pattern change — before (Backbone):**
```javascript
const collection = new PeopleCollection()
const { models, isFetching } = useBackboneCollection(collection)
useEffect(() => { collection.fetch() }, [])
```

**Pattern change — after (tRPC):**
```typescript
const { data: people, isLoading } = trpc.people.list.useQuery()
```

**Mutation — before:**
```javascript
const person = new Person(formData)
await person.save()
```

**Mutation — after:**
```typescript
const utils = trpc.useUtils()
const createPerson = trpc.people.create.useMutation({
  onSuccess: () => utils.people.list.invalidate()
})
createPerson.mutate(formData)
```

**Auth — before (direct axios call):**
```javascript
const response = await authApi.post('/auth/login', { email, password })
localStorage.setItem('auth_token', response.data.session.access_token)
```

**Auth — after (tRPC mutation):**
```typescript
const login = trpc.auth.login.useMutation({
  onSuccess: (data) => {
    localStorage.setItem('auth_token', data.session.access_token)
    // update auth state
  }
})
```

`src/services/auth.ts` is kept but simplified to just localStorage read/write helpers. The tRPC client reads the token automatically via the `headers()` function in the link.

---

### Phase 5 — Legacy File Cleanup

**Delete from frontend:**
```
src/models/         (4 files)
src/collections/    (4 files)
src/hooks/useBackboneModel.js
src/hooks/useBackboneCollection.js
src/services/backboneSync.js
src/services/api.js
src/services/mockAuth.js
src/config/supabase.js
src/router/   src/utils/   src/views/   (empty dirs)
```

**Delete from backend:**
```
src/routes/         (5 files)
src/controllers/    (5 files)
src/middleware/auth.middleware.js
```

---

## Critical Files Involved

| File | Action |
|------|--------|
| `schpro-backend/src/services/supabase.service.js` | Keep, rename to `.ts` |
| `schpro-backend/src/app.js` | Keep, update to mount tRPC adapter |
| `schpro-backend/src/server.js` | Keep, rename to `.ts` |
| `schpro-frontend/src/App.jsx` | Keep, migrate to `.tsx` |
| `schpro-frontend/src/services/auth.js` | Keep, simplify to localStorage helpers |
| `schpro-frontend/vite.config.js` | Update: rename `.ts`, update proxy path to `/api/trpc` |

---

## Deployment (Vercel + Render)

### Backend — Render

Add a TypeScript compile step. Currently Render runs plain JS with no build.

| Setting | Before | After |
|---|---|---|
| Build command | `npm install` | `npm install && npm run build` |
| Start command | `node src/server.js` | `node dist/server.js` |

Add to `schpro-backend/package.json` scripts:
```json
"build": "tsc"
```

Everything else is unchanged: same Express server, same port, same `FRONTEND_URL` CORS env var, same Supabase env vars.

### Frontend — Vercel

No changes to Vercel project settings. Vercel continues to build `schpro-frontend/` in isolation using `vite build`. The `import type { AppRouter }` is erased by esbuild before bundling — the backend source is never fetched or included at runtime.

`VITE_API_BASE_URL` still points to the Render backend URL (no change).

### What does NOT change
- Vercel project settings (framework: Vite, root: `schpro-frontend/`)
- Render service type (Web Service / Express)
- All environment variables on both sides
- CORS configuration
- Custom domains / URLs

---

## Verification

1. `cd schpro-backend && npm install && npm run dev` — confirm tRPC server starts, `/health` returns 200
2. Visit `http://localhost:3000/api/trpc/auth.login` — should return method not allowed (confirms tRPC mount)
3. `cd schpro-frontend && npm install && npm run dev` — confirm Vite starts, no TypeScript errors
4. Register a new account → JWT stored to localStorage
5. CRUD: create/read/update/delete a person, vehicle, equipment
6. Create a booking with assigned people/vehicles/equipment
7. Soft delete + restore a resource
8. Run `tsc --noEmit` in both directories — zero errors confirms type safety end-to-end
