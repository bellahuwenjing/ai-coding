# SchedulePro Backend API

Express.js + Supabase backend for the SchedulePro resource scheduling application.

## Important: Row Level Security (RLS)

**For this project, RLS is DISABLED on all Supabase tables.**

### Why?

1. **Infinite Recursion Issue**: Original RLS policies had self-referencing checks that caused infinite recursion
2. **SERVICE_ROLE_KEY Bypasses RLS**: We use the service role key which bypasses RLS anyway
3. **Manual Filtering**: Backend explicitly filters by `company_id` in every query
4. **Simpler for MVP**: No need to debug complex RLS policies during development

### Security Model

**Company Isolation:** Enforced by backend code, not database policies.

Every query MUST include company_id filter:
```javascript
// ✅ CORRECT - Secure
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('company_id', req.user.company_id)
  .eq('is_deleted', false);

// ❌ WRONG - Returns data from ALL companies!
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('is_deleted', false);
```

**Auth Middleware** (`src/middleware/auth.middleware.js`) verifies JWT and attaches `company_id` to `req.user`.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > API in your Supabase dashboard
3. Copy your credentials:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

### 3. Configure Environment Variables

Edit `.env` file with your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run the Server

**Development (with auto-restart):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3000`

### 5. Test the API

Visit `http://localhost:3000/health` to check if the server is running.

## Project Structure

```
src/
├── controllers/     # Route handlers
├── middleware/      # Auth, error handling
├── services/        # Supabase client, business logic
├── routes/          # API routes
├── utils/           # Helper functions
├── app.js          # Express app configuration
└── server.js       # Server entry point
```

## Architecture: Why Backend Auth Endpoints?

**Question:** Why do we have backend authentication endpoints when Supabase can handle auth in the frontend?

**Answer:** **Registration complexity.**

### The Problem with Frontend-Only Auth

When a user registers, we need to create **3 related records atomically**:
1. User in Supabase Auth
2. Company record
3. Person record (links user to company)

If the frontend handles this:
- 3 separate API calls, each can fail independently
- No transaction guarantees
- Complex error recovery logic in frontend
- Risk of orphaned records (user exists but no company, etc.)

### Our Solution: Backend Wrapper

```javascript
// Frontend makes ONE call
POST /api/auth/register {
  company_name, name, email, password
}

// Backend handles atomically:
1. Create user → 2. Create company → 3. Create person
// If any step fails, backend handles cleanup
```

**Benefits:**
- ✅ Atomic registration (all or nothing)
- ✅ Simpler frontend code
- ✅ Better error handling
- ✅ Consistent data integrity

**Trade-off:** Extra hop (frontend → backend → Supabase), but worth it for registration complexity.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company + user (wraps Supabase Auth)
- `POST /api/auth/login` - Login and get JWT token (wraps Supabase Auth)
- `POST /api/auth/logout` - Logout (wraps Supabase Auth)
- `GET /api/auth/me` - Get current user with company info

### Resources
- `GET /api/people` - List all people
- `POST /api/people` - Create person
- `GET /api/people/:id` - Get person by ID
- `PUT /api/people/:id` - Update person
- `DELETE /api/people/:id` - Soft delete person
- `POST /api/people/:id/undelete` - Restore deleted person

*(Same pattern for `/api/vehicles` and `/api/equipment`)*

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Soft delete booking
- `POST /api/bookings/:id/undelete` - Restore booking

## Next Steps

1. Set up Supabase database schema (see `docs/prd/PRD-backend.md` Section 5)
2. Implement authentication endpoints
3. Implement resource CRUD endpoints
4. Add conflict detection logic
5. Deploy to Railway/Render/Vercel

## Documentation

- Backend PRD: `docs/prd/PRD-backend.md`
- Implementation Plan: `docs/backend-implementation-plan.md`
