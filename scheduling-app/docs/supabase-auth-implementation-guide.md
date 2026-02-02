# Supabase Auth Implementation Guide
## Frontend-First Approach (No Backend Required)

**Created:** February 1, 2026
**Status:** Recommended approach for SchedulePro MVP

---

## Overview

This guide explains how to implement authentication in SchedulePro using Supabase Auth directly from the React frontend, **without building the CodeIgniter backend first**.

---

## Two Implementation Options

### Option A: Frontend → Supabase Directly ✅ RECOMMENDED

**Architecture:**
```
React Frontend → Supabase Client → Supabase Cloud
                                    ├─ Auth (user management)
                                    ├─ Database (PostgreSQL + RLS)
                                    └─ Real-time (subscriptions)
```

**What you do:**
1. Add `@supabase/supabase-js` to React frontend
2. Replace mock authentication with real Supabase Auth
3. Query Supabase database directly from Backbone models
4. Skip building CodeIgniter backend for now

**Benefits:**
- ✅ Fastest to implement (1-2 hours vs 2-3 weeks)
- ✅ No backend code to write or maintain
- ✅ Supabase dashboard for non-technical teammates
- ✅ Authentication works immediately
- ✅ RLS policies protect data automatically at database level
- ✅ Real-time subscriptions available
- ✅ Can add backend layer later if needed

**When to choose:**
- You want to ship fast
- Team includes non-technical members
- You're building an MVP
- You don't need complex server-side logic yet

**Timeline:**
- Setup: 30 minutes
- Replace mock auth: 1 hour
- Update Backbone models: 30-60 minutes
- Testing: 30 minutes
- **Total: 2-3 hours**

---

### Option B: Build Backend First

**Architecture:**
```
React Frontend → CodeIgniter API → Supabase Cloud
                                   ├─ Auth
                                   └─ Database
```

**What you do:**
1. Build entire CodeIgniter backend (2-3 weeks)
2. Implement API endpoints for auth and CRUD
3. Frontend calls your custom API
4. Backend uses Supabase PHP client

**Benefits:**
- ✅ More control over business logic
- ✅ Abstraction layer between frontend and Supabase
- ✅ Server-side processing capabilities
- ✅ Custom validation and workflows

**When to choose:**
- You need complex business logic
- You need server-side processing
- You want to hide Supabase implementation from frontend
- You have time to build and maintain backend

**Timeline:**
- **2-3 weeks** to build backend MVP

---

## Recommended Approach: Option A

### Why Skip the Backend for Now?

1. **Speed:** Get working auth in hours, not weeks
2. **Simplicity:** Less code to write and maintain
3. **Team-friendly:** Non-technical teammates can use Supabase dashboard to:
   - View and manage users
   - Browse and edit database records
   - Monitor logs and activity
   - No code knowledge needed
4. **Security:** RLS policies enforce data isolation at database level (more secure than application code)
5. **Flexibility:** Can add backend later when you need custom logic

### When to Add Backend Later?

Add CodeIgniter backend when you need:
- Complex business logic that shouldn't run client-side
- Third-party API integrations
- Background jobs or scheduled tasks
- Email sending
- Payment processing
- Advanced reporting
- File processing

---

## Implementation Steps (Option A)

### Step 1: Supabase Project Setup

**1.1 Create Supabase Project (if not done):**
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Enter project details (name, password, region)
5. Wait ~2 minutes for provisioning

**1.2 Set Up Database Schema:**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy all CREATE TABLE statements from `docs/prd/PRD-backend.md` Section 5
3. Run each table creation (companies, people, vehicles, equipment, bookings, junction tables)
4. Verify tables appear in **Table Editor**

**1.3 Configure Authentication:**

**What's Required vs Optional:**

| Step | Status | Why |
|------|--------|-----|
| Enable Email provider | ✅ **REQUIRED** | Without this, `signUp()` and `signInWithPassword()` will fail. Email auth is disabled by default. |
| Disable email confirmations | ⚠️ **OPTIONAL** (recommended for MVP) | Makes development easier - users can login immediately after registration without clicking confirmation emails. |
| Set Site URL | ⚠️ **RECOMMENDED** | Used for email redirects and OAuth callbacks. Not strictly required for basic email/password auth, but prevents issues later. |

**Steps:**

1. Go to **Authentication** > **Providers**
2. **Enable "Email" provider** ← ✅ REQUIRED
3. Go to **Authentication** > **Settings**
4. **Disable "Enable email confirmations"** ← Recommended for MVP
   - If you DON'T disable this: Users must click confirmation email before they can log in
   - If you DO disable this: Users can log in immediately after registration
   - For MVP/development: Disable it (faster testing)
   - For production: Keep it enabled (better security)
5. Set **Site URL** to `http://localhost:5173` ← Recommended
   - Used for email confirmation redirects, password reset links, OAuth callbacks
   - Not strictly needed for basic local development
   - But best practice to set it now to prevent issues later

**Minimum to make it work:** Just enable the Email provider (step 2)

**Recommended for best experience:** Do all 5 steps (takes ~2 minutes total)

**1.4 Get API Keys:**
1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (safe to use in frontend)
   - **service_role key** (keep secret, DON'T use in frontend)

---

### Step 2: Frontend Setup

**2.1 Install Supabase Client:**
```bash
cd schpro-frontend
npm install @supabase/supabase-js
```

**2.2 Create Environment Variables:**
```env
# schpro-frontend/.env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**2.3 Create Supabase Client:**
```javascript
// src/config/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

### Step 3: Replace Mock Auth with Real Supabase Auth

**3.1 Update `src/services/auth.js`:**
```javascript
import { supabase } from '../config/supabase'

// Register new user + create company
export async function register({ companyName, name, email, password }) {
  // 1. Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // 2. Create company record
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: companyName, slug: companyName.toLowerCase().replace(/\s+/g, '-') })
    .select()
    .single()

  if (companyError) throw companyError

  // 3. Create person record linked to auth user and company
  const { data: person, error: personError } = await supabase
    .from('people')
    .insert({
      user_id: authData.user.id,
      company_id: company.id,
      name,
      email,
    })
    .select()
    .single()

  if (personError) throw personError

  return { user: authData.user, session: authData.session, person, company }
}

// Login
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Fetch person record
  const { data: person } = await supabase
    .from('people')
    .select('*, companies(*)')
    .eq('user_id', data.user.id)
    .single()

  return { ...data, person }
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current session
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  // Fetch person record
  const { data: person } = await supabase
    .from('people')
    .select('*, companies(*)')
    .eq('user_id', session.user.id)
    .single()

  return { session, person }
}

// Check if user is logged in
export function isAuthenticated() {
  return supabase.auth.getSession().then(({ data }) => !!data.session)
}
```

**3.2 Remove `src/services/mockAuth.js`** (no longer needed)

---

### Step 4: Update Backbone Models to Use Supabase

**4.1 Update `src/models/Person.js`:**
```javascript
import Backbone from 'backbone'
import { supabase } from '../config/supabase'

const Person = Backbone.Model.extend({
  defaults: {
    id: null,
    company_id: null,
    user_id: null,
    name: '',
    email: '',
    phone: '',
    skills: [],
    certifications: [],
    hourly_rate: null,
    is_deleted: false,
    created_at: null,
    updated_at: null,
  },

  // Override sync to use Supabase
  sync(method, model, options) {
    switch (method) {
      case 'read':
        return supabase
          .from('people')
          .select('*')
          .eq('id', model.id)
          .single()
          .then(({ data, error }) => {
            if (error) throw error
            options.success(data)
          })
          .catch(options.error)

      case 'create':
        return supabase
          .from('people')
          .insert(model.toJSON())
          .select()
          .single()
          .then(({ data, error }) => {
            if (error) throw error
            options.success(data)
          })
          .catch(options.error)

      case 'update':
        return supabase
          .from('people')
          .update(model.toJSON())
          .eq('id', model.id)
          .select()
          .single()
          .then(({ data, error }) => {
            if (error) throw error
            options.success(data)
          })
          .catch(options.error)

      case 'delete':
        // Soft delete
        return supabase
          .from('people')
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq('id', model.id)
          .then(({ error }) => {
            if (error) throw error
            options.success()
          })
          .catch(options.error)
    }
  },

  // Undelete method
  undelete() {
    return supabase
      .from('people')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', this.id)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error
        this.set(data)
        return this
      })
  },

  // Validation
  validate(attrs) {
    const errors = {}
    if (!attrs.name || attrs.name.trim().length === 0) {
      errors.name = 'Name is required'
    }
    if (!attrs.email || !attrs.email.includes('@')) {
      errors.email = 'Valid email is required'
    }
    return Object.keys(errors).length > 0 ? errors : null
  },

  isDeleted() {
    return this.get('is_deleted')
  },

  isAssignable() {
    return !this.get('is_deleted')
  },
})

export default Person
```

**4.2 Update `src/collections/PeopleCollection.js`:**
```javascript
import Backbone from 'backbone'
import Person from '../models/Person'
import { supabase } from '../config/supabase'

const PeopleCollection = Backbone.Collection.extend({
  model: Person,

  // Override fetch to use Supabase
  fetch(options = {}) {
    const includeDeleted = options.includeDeleted || false

    let query = supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    return query
      .then(({ data, error }) => {
        if (error) throw error
        this.reset(data)
        if (options.success) options.success(data)
        return data
      })
      .catch((error) => {
        if (options.error) options.error(error)
        throw error
      })
  },

  // Filter methods
  deleted() {
    return this.filter((person) => person.get('is_deleted'))
  },

  getAssignable() {
    return this.filter((person) => !person.get('is_deleted'))
  },
})

export default PeopleCollection
```

**4.3 Apply same pattern to:**
- `src/models/Vehicle.js` → Use `supabase.from('vehicles')`
- `src/collections/VehiclesCollection.js`
- `src/models/Equipment.js` → Use `supabase.from('equipment')`
- `src/collections/EquipmentCollection.js`
- `src/models/Booking.js` → Use `supabase.from('bookings')` + junction tables
- `src/collections/BookingsCollection.js`

---

### Step 5: Remove Mock Data Service

**5.1 Delete `src/services/mockData.js`** (no longer needed)

**5.2 Update `src/services/api.js`:**
```javascript
// Remove USE_MOCK_API flag - always use Supabase
import { supabase } from '../config/supabase'

export { supabase }
```

---

### Step 6: Test Authentication Flow

**6.1 Start frontend:**
```bash
npm run dev
```

**6.2 Test registration:**
1. Click "Register" (create this UI if not exists)
2. Enter company name, name, email, password
3. Check Supabase dashboard → Authentication → Users (should see new user)
4. Check Table Editor → companies (should see new company)
5. Check Table Editor → people (should see new person linked to user)

**6.3 Test login:**
1. Logout
2. Login with same credentials
3. Verify you're redirected to dashboard
4. Check browser localStorage → should see Supabase session token

**6.4 Test data isolation (multi-tenancy):**
1. Register a second company/user
2. Login as user 2
3. Create a person in company 2
4. Logout and login as user 1
5. Verify you **cannot** see company 2's person (RLS enforces this)

---

## How RLS Works (Automatic Company Isolation)

**Row Level Security (RLS) policies automatically filter data:**

1. User logs in → Supabase issues JWT with `user_id`
2. Frontend queries database with that JWT
3. Supabase RLS policy extracts `user_id` from JWT
4. Policy looks up user's `company_id` from `people` table
5. Query automatically filtered to only return rows matching that `company_id`

**Example RLS policy (already in database schema):**
```sql
CREATE POLICY "Users can view people in their company"
    ON people FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));
```

**What this means:**
- ✅ Impossible to see other companies' data (enforced at database level)
- ✅ No manual filtering needed in frontend code
- ✅ More secure than application-level filtering
- ✅ Works automatically for all queries

---

## Advantages Over Backend-First Approach

| Aspect | Option A (Direct Supabase) | Option B (Backend First) |
|--------|---------------------------|--------------------------|
| **Time to working auth** | 2-3 hours | 2-3 weeks |
| **Code to maintain** | Minimal (Supabase client only) | Backend + API layer + frontend |
| **Security** | Database-level RLS | Application-level filtering |
| **Non-technical team access** | ✅ Supabase dashboard | ❌ Need custom admin panel |
| **Real-time updates** | ✅ Built-in | Requires custom implementation |
| **Scalability** | ✅ Managed by Supabase | Manual scaling needed |
| **Cost (MVP)** | Free tier | Hosting costs + development time |

---

## When to Migrate to Backend (If Needed)

You can add the CodeIgniter backend later when you need:

1. **Complex business logic:**
   - Multi-step workflows
   - Complex calculations
   - Advanced validation

2. **Third-party integrations:**
   - Payment processing (Stripe)
   - Email sending (SendGrid)
   - SMS notifications

3. **Background jobs:**
   - Scheduled tasks
   - Batch processing
   - Report generation

4. **Server-side file processing:**
   - Image resizing
   - PDF generation
   - CSV imports

**Migration is easy:**
- Frontend changes API calls from Supabase to your backend
- Backend uses Supabase PHP client internally
- Data stays in Supabase (no migration needed)
- RLS policies continue working

---

## Troubleshooting

### Issue: "User already registered" error
**Cause:** Email already exists in Supabase Auth
**Solution:** Check Authentication → Users in Supabase dashboard, delete test user

### Issue: "Row Level Security policy violation"
**Cause:** RLS policies not set up correctly
**Solution:** Re-run CREATE POLICY statements from PRD Section 5

### Issue: Can't see any data after login
**Cause:** Person record not linked to auth user
**Solution:** Check `people` table has correct `user_id` matching `auth.users.id`

### Issue: CORS errors in browser
**Cause:** Supabase URL or keys incorrect
**Solution:** Verify `.env` values match Supabase dashboard → Settings → API

---

## Summary

**Option A (Recommended):**
- ✅ Add Supabase client to React frontend
- ✅ Use Supabase Auth for registration/login
- ✅ Query database directly from Backbone models
- ✅ RLS handles security automatically
- ✅ Ship in 2-3 hours, not 2-3 weeks
- ✅ Add backend later only if needed

**Next Steps:**
1. Create Supabase project (if not done)
2. Run database schema SQL
3. Install `@supabase/supabase-js` in frontend
4. Replace mock auth with real Supabase auth
5. Update Backbone models to use Supabase client
6. Test and ship!

**Ready to implement?** Follow Step 1 to get started.
