# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SchedulePro** - A multi-tenant resource scheduling application for managing people, vehicles, and equipment bookings.

- **Backend**: Express.js + Supabase (RESTful API with Supabase Auth)
- **Frontend**: React + Vite + Backbone.js (hybrid architecture)
- **Landing Page**: Next.js 16 (marketing site)
- **Status**: Planning phase - backend and frontend not yet initialized

## Essential Commands

### Landing Page (Next.js)
```bash
cd landing-page
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build with Turbopack
npm run lint             # Run ESLint
```

### Backend (Express.js + Supabase) - When Initialized
```bash
cd schpro-backend
npm run dev              # Start server with nodemon (http://localhost:3000)
npm start                # Start server (production)
npm test                 # Run tests
node src/utils/seed.js   # Seed database (if seeder created)
```

### Frontend (React + Vite + Backbone) - When Initialized
```bash
cd schpro-frontend
npm run dev              # Start server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
```

## Architecture

### Multi-Tenant Data Model

**Core Principle**: Every resource is scoped to a company. The `company_id` is stored in the JWT token and automatically filters all queries.

**Key Entities**:
- **Companies**: Top-level tenant isolation
- **Users**: Company members with roles (Admin/Member)
- **People**: Schedulable human resources (can be linked to users)
- **Vehicles**: Fleet vehicles with capacity tracking
- **Equipment**: Tools and equipment with condition tracking
- **Bookings**: Time-based resource assignments with many-to-many relationships to people, vehicles, and equipment

**Authentication Flow**:
1. User registers → creates company + admin user
2. Login returns JWT with payload: `{sub: user_id, company_id, role, exp}`
3. All API requests include `Authorization: Bearer <token>`
4. `CompanyFilter` automatically scopes queries to token's `company_id`

### Frontend Hybrid Architecture

**Why Backbone + React?**
- **Backbone**: Data layer (models, collections, REST sync, routing)
- **React**: View layer (components, rendering)
- **Bridge**: Custom hooks (`useBackboneModel`, `useBackboneCollection`) sync Backbone events to React state

**Data Flow**:
```
API ←→ Backbone Models/Collections ←→ React Hooks ←→ React Components
```

**Key Integration Points**:
- `src/services/backboneSync.js` - Custom sync adapter for API
- `src/hooks/` - React hooks that listen to Backbone events
- `src/router/` - Backbone router for navigation
- `src/models/` - Backbone models (Person, Vehicle, Equipment, Booking)
- `src/collections/` - Backbone collections with company scoping

### Authentication Architecture

**Backend wraps Supabase Auth** instead of frontend calling Supabase directly.

**Why?** Registration requires creating 3 related records atomically:
1. User in Supabase Auth
2. Company record
3. Person record (links user to company)

**Approach:**
- Frontend calls `POST /api/auth/register` (one call)
- Backend handles: create user → create company → create person
- If any step fails, backend handles cleanup
- **Benefits**: Atomic registration, simpler frontend, consistent data

**Trade-off**: Extra hop (frontend → backend → Supabase) but worth it for complex registration flow.

### Soft Delete Pattern

All entities use `is_deleted` flag (0 = active, 1 = deleted):
- Default queries filter `is_deleted = 0`
- Deleted items remain in database for audit trail
- Undelete functionality sets `is_deleted = 0, deleted_at = NULL`
- Admin-only feature

### Row Level Security (RLS) - DISABLED for MVP

**Status**: RLS is **disabled** on all Supabase tables.

**Why Disabled:**
- Original RLS policies caused infinite recursion (self-referencing checks)
- We use `SERVICE_ROLE_KEY` which bypasses RLS anyway
- Backend manually filters by `company_id` in every query

**Security Model:**
```javascript
// Every query must filter by company_id
await supabase
  .from('people')
  .select('*')
  .eq('company_id', req.user.company_id)  // ← CRITICAL!
```

**Auth middleware** verifies JWT and attaches `company_id` to `req.user` for all protected routes.

**Important:** Never query without filtering by `company_id` - this would return data from all companies!

### Conflict Detection

**Purpose**: Prevent double-booking resources during overlapping time periods.

**Implementation** (backend):
- `services/conflict.service.js` - Checks time overlaps for each entity type
- Separate checks for people, vehicles, equipment
- Returns 422 with conflict details if overlaps found
- MVP: User cannot proceed if conflicts exist (no override)

## Documentation Structure

**Read these files to understand project context:**

1. **`docs/GETTING-STARTED.md`** - Quick reference for commands and setup
2. **`docs/prd/PRD-backend.md`** - Complete backend API specification (endpoints, models, validation)
3. **`docs/prd/PRD-frontend.md`** - Complete UI specification (components, workflows, user stories)
4. **`docs/backend-implementation-plan.md`** - Backend development roadmap by phase
5. **`docs/frontend-implementation-plan.md`** - Frontend development roadmap by phase
6. **`workflow-conventions.md`** - User's workflow preferences and documentation standards
7. **`prompt-history.md`** - Evolution of product decisions through prompts

## Workflow Conventions

### Documentation Requirements

**When in plan mode**, before exiting:
1. Update `prompt-history.md` with user's exact words and response summary
2. Log prompts to `session-chat-log.md` during the session to prevent loss during mode transitions

**Format for prompt-history.md**:
```markdown
### Prompt N

**User (exact words):**
> [exact user prompt here]

**Response:** [summary of what was done]
```

### Session Management

**Starting new sessions**:
- Reference `@workflow-conventions.md` for user preferences
- Reference `@how-claude-works.md` if workflow reminders needed
- Read implementation plans and PRDs for technical context

**Important**: Mode switching does NOT create new sessions, but context may be cleared to save tokens.

### Communication Style

- Concise and direct
- Professional and objective tone
- No emojis unless user explicitly requests
- Prefer specialized tools over bash for file operations

## Key Configuration Files

### Backend .env (when initialized)
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
```

### Frontend .env (when initialized)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=SchedulePro
```

## Database Schema (Supabase PostgreSQL)

**Core Tables** (managed in Supabase):
1. `companies` - Tenant isolation
2. `people` - Human resources (links to Supabase Auth via `user_id`)
3. `vehicles` - Fleet management
4. `equipment` - Tool/equipment tracking
5. `bookings` - Time-based assignments
6. `booking_people` - Many-to-many junction
7. `booking_vehicles` - Many-to-many junction
8. `booking_equipment` - Many-to-many junction

**Authentication**: Handled by Supabase Auth (`auth.users` table)

All tables include:
- `company_id` UUID for multi-tenancy
- `is_deleted` boolean for soft delete
- `created_at`, `updated_at`, `deleted_at` timestamps (PostgreSQL TIMESTAMPTZ)
- **Row Level Security (RLS) policies** for automatic company isolation

## API Endpoints Structure

### Authentication (Public)
- `POST /api/auth/register` - Create company + admin user
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/logout` - Invalidate token

### Resources (Protected, Auto-Scoped to Company)
- `GET|POST /api/people` - List/create people
- `GET|PUT|DELETE /api/people/{id}` - Read/update/delete person
- `POST /api/people/{id}/undelete` - Restore deleted person
- Same pattern for `/api/vehicles` and `/api/equipment`

### Bookings (Protected, Auto-Scoped to Company)
- `GET|POST /api/bookings` - List/create bookings
- `GET|PUT|DELETE /api/bookings/{id}` - Read/update/delete booking
- `POST /api/bookings/{id}/undelete` - Restore deleted booking

**Booking Assignment**: Single API call assigns all people, vehicles, and equipment via junction tables.

## Development Phases

**Current Status**: Planning complete, awaiting initialization

**Phase 1**: Project setup (Day 1)
- Initialize backend with Express.js + Supabase
- Initialize frontend with Vite + React + Backbone
- Create database schema in Supabase

**Phase 2**: Authentication (Day 2-3)
- Supabase Auth integration (register, login, logout)
- JWT token verification middleware
- Protected route setup

**Phase 3**: Resource Management (Day 4-6)
- CRUD for people, vehicles, equipment
- Soft delete and undelete
- No authorization needed in MVP (all users are admins)

**Phase 4**: Booking System (Day 7-9)
- Booking CRUD with multi-entity assignment
- Conflict detection
- Booking list views and filters

**Phase 5**: Testing & Polish (Day 10-11)
- Manual testing
- Bug fixes
- Documentation

**Total MVP Time**: 1.5-2 weeks

## Important Notes

- Backend and frontend directories (`schpro-backend/`, `schpro-frontend/`) exist but are empty - not yet initialized
- Landing page is fully initialized and functional
- All PRDs and implementation plans are complete and located in `docs/`
- Follow initialization checklist in `docs/initialization-checklist.md` when setting up backend/frontend
- User prefers exact documentation of prompts - maintain `prompt-history.md` with user's exact words
- Reference `workflow-conventions.md` for detailed documentation and session management standards

## Hosting Options

**Backend (Express.js)**:
- **Local Development**: `npm run dev` on `http://localhost:3000`
- **Production Options**:
  - Railway (recommended - always-on, no cold starts)
  - Render (free tier with sleep on inactivity)
  - Vercel (serverless functions)
  - Fly.io (global edge deployment)

**Database**: Supabase cloud (free tier includes authentication + PostgreSQL)

**Frontend**: Vercel (recommended for React + Vite)

**Landing Page**: Already deployed or can deploy to Vercel
