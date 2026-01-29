# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SchedulePro** - A multi-tenant resource scheduling application for managing people, vehicles, and equipment bookings.

- **Backend**: CodeIgniter 4 + MySQL (RESTful API with JWT auth)
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

### Backend (CodeIgniter 4) - When Initialized
```bash
cd schpro-backend
php spark serve          # Start server (http://localhost:8080)
php spark migrate        # Run migrations
php spark migrate:status # Check migration status
php spark db:seed DatabaseSeeder  # Seed database
php spark routes         # View all routes
php spark test           # Run tests
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

### Soft Delete Pattern

All entities use `is_deleted` flag (0 = active, 1 = deleted):
- Default queries filter `is_deleted = 0`
- Deleted items remain in database for audit trail
- Undelete functionality sets `is_deleted = 0, deleted_at = NULL`
- Admin-only feature

### Conflict Detection

**Purpose**: Prevent double-booking resources during overlapping time periods.

**Implementation** (backend):
- `Libraries/ConflictDetection.php` - Checks time overlaps for each entity type
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
CI_ENVIRONMENT = development
app.baseURL = 'http://localhost:8080/'
database.default.hostname = localhost
database.default.database = schedulepro
database.default.username = root
database.default.password = your_password
jwt.secret = generate_with_openssl_rand_base64_32
jwt.expire = 86400
cors.allowedOrigins = http://localhost:5173
```

### Frontend .env (when initialized)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEV_MODE=true
VITE_APP_NAME=SchedulePro
```

## Database Schema

**8 Core Tables**:
1. `companies` - Tenant isolation
2. `users` - Authentication and authorization
3. `people` - Human resources
4. `vehicles` - Fleet management
5. `equipment` - Tool/equipment tracking
6. `bookings` - Time-based assignments
7. `booking_people` - Many-to-many junction
8. `booking_vehicles` - Many-to-many junction
9. `booking_equipment` - Many-to-many junction

All tables include:
- `company_id` for multi-tenancy
- `is_deleted` for soft delete
- `created_at`, `updated_at`, `deleted_at` timestamps

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

**Phase 1**: Project setup (1-2 days)
- Initialize backend with CodeIgniter 4
- Initialize frontend with Vite + React
- Create database and run migrations

**Phase 2**: Authentication (Week 1-2)
- JWT token generation and validation
- Register/login endpoints
- Protected route middleware

**Phase 3**: Resource Management (Week 2-5)
- CRUD for people, vehicles, equipment
- Soft delete and undelete
- Admin permission enforcement

**Phase 4**: Booking System (Week 5-7)
- Booking CRUD with multi-entity assignment
- Conflict detection
- Booking list views

**Phase 5**: Testing & Polish (Week 8+)
- Unit and integration tests
- Database seeders
- UI refinements

## Important Notes

- Backend and frontend directories (`schpro-backend/`, `schpro-frontend/`) exist but are empty - not yet initialized
- Landing page is fully initialized and functional
- All PRDs and implementation plans are complete and located in `docs/`
- Follow initialization checklist in `docs/initialization-checklist.md` when setting up backend/frontend
- User prefers exact documentation of prompts - maintain `prompt-history.md` with user's exact words
- Reference `workflow-conventions.md` for detailed documentation and session management standards
