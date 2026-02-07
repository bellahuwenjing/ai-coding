# Backend Implementation Plan
## SchedulePro Express.js + Supabase Multi-Tenant API (Lean MVP)

---

## Overview

This plan outlines the implementation strategy for building the SchedulePro backend API using Express.js with Supabase (PostgreSQL + Auth) for multi-tenant architecture.

**Based on:** `docs/prd/PRD-backend.md` v5.0 (Express.js + Supabase Edition)

**Key Changes from Original Plan:**
- Use Express.js instead of CodeIgniter 4 (Node.js instead of PHP)
- Use Supabase for database (PostgreSQL) and authentication
- Use @supabase/supabase-js official JavaScript client
- RLS (Row Level Security) handles company isolation automatically
- No role-based authorization in MVP (all users are admins)
- No Redis caching needed
- Simple local development with `npm run dev`

---

## Phase 1: Project Setup & Database (Day 1-2)

### 1.1 Initialize Express.js Project

**Tasks:**
- [ ] Initialize Node.js project with npm
- [ ] Install Express.js and dependencies
- [ ] Install Supabase JavaScript client
- [ ] Set up project structure
- [ ] Configure environment variables (.env file)
- [ ] Test basic server startup
- [ ] Configure CORS for frontend connection

**Commands:**
```bash
cd schpro-backend
npm init -y
npm install express dotenv cors @supabase/supabase-js
npm install -D nodemon

# Create project structure
mkdir -p src/{controllers,middleware,services,routes,utils}
touch src/app.js src/server.js .env .gitignore
```

**Files to configure:**
- `.env` - Supabase URL, API keys, port, CORS settings
- `package.json` - Add dev and start scripts
- `.gitignore` - Ignore node_modules and .env

---

### 1.2 Supabase Project Setup

**Tasks:**
- [ ] Create Supabase project at https://supabase.com
- [ ] Note project URL and API keys (anon, service_role)
- [ ] Create database schema using Supabase SQL Editor
- [ ] Run all CREATE TABLE statements from PRD Section 5
- [ ] **Disable RLS on all tables** (see note below)
- [ ] Test authentication settings (enable email/password)
- [ ] Disable email confirmation for MVP

**Important: Row Level Security (RLS) Note**

For MVP, we **disable RLS** on all tables. Here's why:

**The RLS Infinite Recursion Issue:**
- The original RLS policies had self-referencing checks
- Example: `people` table policy checked `people` table to verify access
- This caused infinite recursion: "to check if you can read people, read people, which checks if you can read people..."
- Error: `"infinite recursion detected in policy for relation 'people'"`

**Why Disabling RLS is Safe for MVP:**
1. **We use SERVICE_ROLE_KEY** - bypasses RLS anyway
2. **Backend manually filters** - every query includes `.eq('company_id', userCompanyId)`
3. **Frontend never accesses Supabase** - all requests go through backend
4. **Backend validates JWT tokens** - auth middleware ensures user identity
5. **Company isolation enforced in code** - user's company_id attached to req.user

**Security Approach:**
```javascript
// EVERY query must filter by company_id manually
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('company_id', req.user.company_id)  // ← REQUIRED for security!
  .eq('is_deleted', false);
```

**For Production:**
- **Option A**: Keep RLS disabled, rely on backend filtering (current approach)
- **Option B**: Fix RLS policies to avoid recursion and use ANON_KEY
- **Option C**: Hybrid - use RLS for frontend direct access, SERVICE_ROLE_KEY for complex operations

**Recommendation:** Stick with Option A (disabled RLS + manual filtering) for simplicity. It's secure as long as every query filters by `company_id`.

**SQL to run in Supabase SQL Editor:**
```sql
-- Copy all CREATE TABLE statements from PRD Section 5
-- Run companies table first
-- Then people, vehicles, equipment, bookings
-- Finally junction tables
-- Each table includes RLS policies
```

**Supabase Dashboard Steps:**
1. Go to SQL Editor
2. Paste schema SQL (from PRD Section 5)
3. Run each table creation separately
4. Go to Authentication > Settings
5. Enable Email provider
6. Disable email confirmation for MVP (or handle in code)
7. Copy API keys to .env

**Files to create:**
- `app/Config/Supabase.php` - Supabase configuration class
- `app/Libraries/SupabaseClient.php` - Wrapper for supabase-php

---

### 1.3 Supabase Client Setup

**Tasks:**
- [ ] Create Supabase service to initialize client
- [ ] Configure Express app with middleware
- [ ] Create auth middleware to verify JWT tokens
- [ ] Test connection to Supabase
- [ ] Set up basic routes structure

**Files to create:**
- `src/services/supabase.service.js` - Supabase client initialization
- `src/middleware/auth.middleware.js` - Verify Supabase JWT tokens
- `src/app.js` - Express app configuration
- `src/server.js` - Server entry point

**src/services/supabase.service.js Example:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

**Important: SERVICE_ROLE_KEY vs ANON_KEY**

We use `SUPABASE_SERVICE_ROLE_KEY` in the backend for these reasons:

**SERVICE_ROLE_KEY:**
- ⚠️ **Bypasses all Row Level Security (RLS) policies**
- Full admin access to database
- Required for registration flow (user doesn't exist yet, so RLS would block)
- Must manually filter by `company_id` in all queries
- **Never expose to frontend**

**ANON_KEY (alternative):**
- ✅ Respects RLS policies automatically
- RLS handles company isolation (no manual filtering needed)
- More secure for regular operations
- Can't be used during registration (user doesn't exist in `people` table yet)

**MVP Approach:**
1. Use SERVICE_ROLE_KEY for simplicity
2. Manually add `company_id` filters to all queries
3. Post-MVP: Consider creating two clients:
   - Admin client (SERVICE_ROLE_KEY) for registration only
   - Regular client (ANON_KEY) for all other operations (RLS handles filtering)

**Critical Security Note:** With SERVICE_ROLE_KEY, you MUST manually filter every query by `company_id` to prevent data leaks:

```javascript
// WRONG - Returns all people from all companies!
const { data } = await supabase.from('people').select('*');

// CORRECT - Filter by company_id
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('company_id', userCompanyId);
```

**src/app.js Example:**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes (to be added)
// app.use('/api/auth', authRoutes);
// app.use('/api/people', peopleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
```

**src/server.js Example:**
```javascript
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

### 1.4 Package.json Scripts

**Tasks:**
- [ ] Add dev and start scripts to package.json
- [ ] Configure nodemon for auto-restart during development

**package.json scripts:**
```json
{
  "name": "schpro-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## Phase 2: Authentication System (Day 3-4)

### Architecture Decision: Backend Auth Endpoints vs Frontend-Only Supabase

**Decision:** We use **backend authentication endpoints** that wrap Supabase Auth, rather than having the frontend call Supabase directly.

#### Why Not Frontend-Only Supabase Auth?

While Supabase can handle auth entirely in the frontend, **registration requires creating 3 related records**:

**The Registration Problem:**
```javascript
// If frontend handles registration directly:
1. supabase.auth.signUp({ email, password })        // Creates user in Supabase Auth
2. POST /api/companies { name }                     // Create company (backend call)
3. POST /api/people { user_id, company_id, ... }    // Create person (backend call)

// Problems:
- What if step 2 fails? User exists but no company!
- What if step 3 fails? User + company exist but no person record!
- Frontend has to handle complex multi-step error recovery
- No transaction guarantees
```

#### Our Approach: Backend Wrapper Endpoints

**How it works:**
```javascript
// Frontend makes ONE call:
POST /api/auth/register { company_name, name, email, password }

// Backend handles atomically:
1. Create user in Supabase Auth
2. Create company record
3. Create person record linking user to company
4. Return session + profile data

// If ANY step fails, backend can handle rollback/cleanup
```

**Benefits:**
- ✅ **Atomic registration** - all records created or none
- ✅ **Simpler frontend** - one API call instead of managing complex flow
- ✅ **Better error handling** - backend can rollback/cleanup
- ✅ **Business logic in backend** - registration complexity hidden from frontend
- ✅ **Consistent data** - no orphaned users or companies

**Trade-offs:**
- ❌ Extra hop (frontend → backend → Supabase instead of frontend → Supabase directly)
- ❌ More backend code to maintain

**Endpoints We Provide:**
- `POST /api/auth/register` - Create user + company + person (complex, needs backend)
- `POST /api/auth/login` - Login and return profile data (backend adds company info)
- `POST /api/auth/logout` - Logout (could be frontend-only, but we provide for consistency)
- `GET /api/auth/me` - Get current user profile (enriched with company data)

**Frontend Still Uses Supabase Client For:**
- Token storage and management (localStorage)
- Automatic token refresh
- Session persistence
- (Optional) Password reset flows

**Note:** This is the recommended pattern for complex registration flows. For simpler apps where users don't need company setup, frontend-only Supabase Auth would be fine.

---

### 2.1 Registration Endpoint

**Tasks:**
- [ ] Create `RegisterController.php`
- [ ] Implement `POST /api/auth/register` endpoint
  - Validate company name, email, password
  - Call Supabase Auth `signUp()` to create user
  - Create company record in companies table
  - Create person record linked to company and Supabase user_id
  - Return session tokens
- [ ] Add validation rules for registration
- [ ] Test registration with Postman/Insomnia

**Logic Flow:**
1. Validate input (company_name, name, email, password)
2. Call `$supabase->auth->signUp(['email' => $email, 'password' => $password])`
3. Get user_id from Supabase response
4. Create company record (INSERT into companies table)
5. Create person record (INSERT into people table with user_id and company_id)
6. Return success with session tokens

**Request body:**
```json
{
  "company_name": "Acme Corp",
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@acme.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "jwt_refresh_token"
    }
  }
}
```

**Files to create:**
- `app/Controllers/Auth/RegisterController.php`
- `app/Config/Validation.php` - Add registration validation rules

---

### 2.2 Login Endpoint

**Tasks:**
- [ ] Create `LoginController.php`
- [ ] Implement `POST /api/auth/login` endpoint
  - Validate email and password
  - Call Supabase Auth `signInWithPassword()`
  - Get user_id from session
  - Fetch person record from people table
  - Return token and profile data
- [ ] Add validation rules for login
- [ ] Test login flow

**Logic Flow:**
1. Validate input (email, password)
2. Call `$supabase->auth->signInWithPassword(['email' => $email, 'password' => $password])`
3. Get user_id from Supabase session
4. Query people table: `SELECT * FROM people WHERE user_id = $user_id`
5. Return session tokens and profile

**Request body:**
```json
{
  "email": "john@acme.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@acme.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "jwt_refresh_token"
    },
    "profile": {
      "id": "person_uuid",
      "name": "John Doe",
      "company_id": "company_uuid"
    }
  }
}
```

**Files to create:**
- `app/Controllers/Auth/LoginController.php`

---

### 2.3 Logout Endpoint

**Tasks:**
- [ ] Create `LogoutController.php`
- [ ] Implement `POST /api/auth/logout` endpoint
- [ ] Call Supabase Auth `signOut()`
- [ ] Return success message

**Note:** Supabase handles token invalidation server-side.

**Files to create:**
- `app/Controllers/Auth/LogoutController.php`

---

### 2.4 Get Current User Endpoint

**Tasks:**
- [ ] Create endpoint `GET /api/auth/me`
- [ ] Extract user info from JWT token
- [ ] Return current person data
- [ ] Protect with AuthFilter

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "company_id": 1,
    "name": "John Doe",
    "email": "john@acme.com",
    "role": "admin"
  }
}
```

---

### 2.5 Test Authentication Flow

**Tasks:**
- [ ] Test complete flow: Register → Login → Access protected route
- [ ] Test invalid credentials
- [ ] Test expired token (adjust JWT expiration for testing)
- [ ] Test missing token
- [ ] Verify company isolation in JWT payload

---

## Phase 3: Multi-Tenancy Testing (Day 5)

### 3.1 Understanding RLS-Based Isolation

**Key Concept:** With Supabase RLS, company isolation is **automatic**. No manual filtering needed in application code.

**How it works:**
1. User logs in → Supabase issues JWT with `sub` (user_id)
2. Request to API → SupabaseAuthFilter verifies JWT
3. Database query → RLS policies automatically filter by company_id:
   ```sql
   -- RLS policy extracts user_id from JWT, looks up company_id
   USING (company_id IN (
       SELECT company_id FROM people WHERE user_id = auth.uid()
   ))
   ```
4. Only rows matching user's company are returned

**No company scoping code needed in models!** Supabase handles it at database level.

---

### 3.2 Verify RLS Policies Work

**Tasks:**
- [ ] Test that RLS policies are active (via Supabase dashboard)
- [ ] Verify auth.uid() function works in SQL queries
- [ ] Test a simple SELECT query with authenticated Supabase client

**Test query in Supabase SQL Editor:**
```sql
-- This should only return rows for the authenticated user's company
SELECT * FROM people WHERE is_deleted = false;
```

---

### 3.3 Test Multi-Tenant Isolation

**Tasks:**
- [ ] Register two different companies via API
- [ ] Login as user from company A
- [ ] Create person in company A
- [ ] Login as user from company B
- [ ] Verify company B user cannot see company A's person
- [ ] Verify cross-company access is prevented automatically

---

## Phase 4: People Management (Day 6-7)

### 4.1 Person Model & Entity

**Tasks:**
- [ ] Create `PersonModel.php` with Supabase client queries:
  - CRUD operations using `$supabase->from('people')`
  - Soft delete support (`is_deleted` field)
  - Query methods: `withDeleted()`, `onlyDeleted()`, `assignable()`
  - **No password handling** (Supabase Auth handles this)
  - **No company_id filtering** (RLS handles this)
- [ ] Create `Person` entity with:
  - Attribute casting (dates, booleans)
  - Helper methods: `isDeleted()`, `isAssignable()`
  - **No role methods in MVP** (all users are admins)
- [ ] Test person creation and retrieval

**Note:** Simplified from original plan because:
- Supabase Auth handles passwords
- RLS handles company scoping
- No roles in MVP

**Files to create:**
- `app/Models/PersonModel.php`
- `app/Entities/Person.php`

---

### 4.2 Person CRUD Endpoints

**Tasks:**
- [ ] Create `PersonController.php`
- [ ] Implement endpoints:
  - `GET /api/people` - List all people (with optional `?assignable=true` filter)
  - `GET /api/people/:id` - Get person by ID
  - `POST /api/people` - Create new person
  - `PUT /api/people/:id` - Update person
  - `DELETE /api/people/:id` - Soft delete person
  - `POST /api/people/:id/undelete` - Undelete person
- [ ] Add validation rules for person creation/update
- [ ] **No admin-only restrictions in MVP** (all authenticated users can CRUD)
- [ ] Test all endpoints with Postman

**Person Creation Logic:**
1. Validate input (name, email, password)
2. Call Supabase Auth `signUp()` to create auth user
3. Get user_id from response
4. Get company_id from authenticated user's profile
5. INSERT person record into people table
6. Return created person

**Validation rules:**
- Name: required
- Email: required, valid email, unique
- Password: required on create (for Supabase Auth), min 8 characters
- **No role field** (MVP assumes all are admins)

**Files to create:**
- `app/Controllers/PersonController.php`

---

### 4.3 Assignable People Filter

**Tasks:**
- [ ] Implement `assignable()` query filter in PersonModel
  - Returns only members (excludes admins)
  - Excludes deleted people by default
- [ ] Test `GET /api/people?assignable=true` endpoint
- [ ] Verify admins are excluded from assignable list

---

### 4.4 Test People Management

**Tasks:**
- [ ] Create multiple people (admin and member roles)
- [ ] Update person details
- [ ] Soft delete person
- [ ] Verify soft-deleted person is excluded from default queries
- [ ] Undelete person
- [ ] Verify assignable filter works correctly

---

## Phase 5: Vehicle Management (Week 3)

### 5.1 Vehicle Model & Entity

**Tasks:**
- [ ] Create `VehicleModel.php` with:
  - CRUD operations
  - Company scoping
  - Soft delete support
  - Query builder methods: `withDeleted()`, `onlyDeleted()`
- [ ] Create `Vehicle` entity with:
  - Attribute casting
  - Helper methods: `isDeleted()`
- [ ] Test vehicle creation

**Files to create:**
- `app/Models/VehicleModel.php`
- `app/Entities/Vehicle.php`

---

### 5.2 Vehicle CRUD Endpoints

**Tasks:**
- [ ] Create `VehicleController.php`
- [ ] Implement endpoints:
  - `GET /api/vehicles` - List all vehicles
  - `GET /api/vehicles/:id` - Get vehicle by ID
  - `POST /api/vehicles` - Create vehicle (Admin only)
  - `PUT /api/vehicles/:id` - Update vehicle (Admin only)
  - `DELETE /api/vehicles/:id` - Soft delete vehicle (Admin only)
  - `POST /api/vehicles/:id/restore` - Undelete vehicle (Admin only)
- [ ] Add validation rules
- [ ] Test all endpoints

**Validation rules:**
- Name: required
- License plate: required, unique within company

**Files to create:**
- `app/Controllers/VehicleController.php`

---

### 5.3 Test Vehicle Management

**Tasks:**
- [ ] Create vehicles
- [ ] Update vehicle details
- [ ] Soft delete vehicle
- [ ] Undelete vehicle
- [ ] Verify deleted vehicles excluded by default

---

## Phase 6: Equipment Management (Week 3)

### 6.1 Equipment Model & Entity

**Tasks:**
- [ ] Create `EquipmentModel.php` with CRUD and soft delete
- [ ] Create `Equipment` entity
- [ ] Test equipment creation

**Files to create:**
- `app/Models/EquipmentModel.php`
- `app/Entities/Equipment.php`

---

### 6.2 Equipment CRUD Endpoints

**Tasks:**
- [ ] Create `EquipmentController.php`
- [ ] Implement endpoints (same pattern as vehicles):
  - `GET /api/equipment`
  - `GET /api/equipment/:id`
  - `POST /api/equipment` (Admin only)
  - `PUT /api/equipment/:id` (Admin only)
  - `DELETE /api/equipment/:id` (Admin only)
  - `POST /api/equipment/:id/restore` (Admin only)
- [ ] Add validation rules
- [ ] Test all endpoints

**Validation rules:**
- Name: required
- Serial number: required, unique within company

**Files to create:**
- `app/Controllers/EquipmentController.php`

---

### 6.3 Test Equipment Management

**Tasks:**
- [ ] Create equipment
- [ ] Update equipment
- [ ] Soft delete equipment
- [ ] Undelete equipment

---

## Phase 7: Booking Management (Week 4-5)

### 7.1 Booking Model & Junction Models

**Tasks:**
- [ ] Create `BookingModel.php` with:
  - CRUD operations
  - Company scoping
  - Soft delete support
  - Relationships with junction tables
- [ ] Create `BookingPersonModel.php` - Junction table for people
- [ ] Create `BookingVehicleModel.php` - Junction table for vehicles
- [ ] Create `BookingEquipmentModel.php` - Junction table for equipment
- [ ] Create `Booking` entity with helper methods:
  - `isDeleted()`
  - `getAssignedPeople()`
  - `getAssignedVehicles()`
  - `getAssignedEquipment()`
- [ ] Test booking creation manually

**Files to create:**
- `app/Models/BookingModel.php`
- `app/Models/BookingPersonModel.php`
- `app/Models/BookingVehicleModel.php`
- `app/Models/BookingEquipmentModel.php`
- `app/Entities/Booking.php`

---

### 7.2 Booking Service

**Tasks:**
- [ ] Create `BookingService.php` library with:
  - `createBooking($data)` - Create booking and attach entities
  - `updateBooking($id, $data)` - Update booking and sync entities
  - `deleteBooking($id)` - Soft delete booking
  - `restoreBooking($id)` - Undelete booking
  - `attachEntities($bookingId, $personIds, $vehicleIds, $equipmentIds)`
  - `detachEntities($bookingId)`
  - `syncEntities($bookingId, $personIds, $vehicleIds, $equipmentIds)`
- [ ] Handle transaction logic for creating booking + junction records
- [ ] Test service methods

**Files to create:**
- `app/Libraries/BookingService.php`

---

### 7.3 Booking CRUD Endpoints

**Tasks:**
- [ ] Create `BookingController.php`
- [ ] Implement endpoints:
  - `GET /api/bookings` - List bookings with filters (date range, entity filters)
  - `GET /api/bookings/:id` - Get booking with assigned entities
  - `POST /api/bookings` - Create booking with entity assignments (Admin only)
  - `PUT /api/bookings/:id` - Update booking (Admin only)
  - `DELETE /api/bookings/:id` - Soft delete booking (Admin only)
  - `POST /api/bookings/:id/restore` - Undelete booking (Admin only)
- [ ] Add validation rules:
  - Title: required
  - Start time: required, valid datetime
  - End time: required, valid datetime, after start time
  - At least one entity required (person, vehicle, or equipment)
- [ ] Use BookingService for create/update operations
- [ ] Test all endpoints

**Request body example:**
```json
{
  "title": "Site Visit",
  "location": "123 Main St",
  "start_time": "2026-02-15 09:00:00",
  "end_time": "2026-02-15 11:00:00",
  "notes": "Client meeting",
  "person_ids": [1, 2],
  "vehicle_ids": [1],
  "equipment_ids": []
}
```

**Files to create:**
- `app/Controllers/BookingController.php`

---

### 7.4 Booking Filters & Query Methods

**Tasks:**
- [ ] Implement query filters in BookingModel:
  - `forPerson($personId)` - Bookings assigned to person
  - `forVehicle($vehicleId)` - Bookings assigned to vehicle
  - `forEquipment($equipmentId)` - Bookings assigned to equipment
  - `inDateRange($start, $end)` - Bookings within date range
  - `withDeleted()` - Include soft-deleted bookings
  - `onlyDeleted()` - Only soft-deleted bookings
- [ ] Support query parameters in `GET /api/bookings`:
  - `?person_id=1`
  - `?vehicle_id=2`
  - `?equipment_id=3`
  - `?start_date=2026-02-01`
  - `?end_date=2026-02-28`
  - `?include_deleted=true`
- [ ] Test filtering combinations

---

### 7.5 Test Booking Management

**Tasks:**
- [ ] Create booking with single entity (person only)
- [ ] Create booking with multiple entities (person + vehicle + equipment)
- [ ] Update booking and change assigned entities
- [ ] Soft delete booking
- [ ] Undelete booking
- [ ] Test filtering by date range
- [ ] Test filtering by entity type

---

## Phase 8: Conflict Detection (Day 12-13)

### 8.1 Conflict Detection Library

**Tasks:**
- [ ] Create `ConflictDetection.php` library
- [ ] Implement `findConflicts($bookingData)` method using Supabase queries:
  - Check for overlapping time ranges
  - Check each assigned person for conflicts
  - Check each assigned vehicle for conflicts
  - Check each assigned equipment for conflicts
  - Exclude current booking when updating
  - Return array of conflicting bookings with entity details
- [ ] Implement helper methods:
  - `timeRangesOverlap($start1, $end1, $start2, $end2)`
  - `checkPersonConflicts($personIds, $start, $end, $excludeBookingId)`
  - `checkVehicleConflicts($vehicleIds, $start, $end, $excludeBookingId)`
  - `checkEquipmentConflicts($equipmentIds, $start, $end, $excludeBookingId)`

**Conflict Query Example (Supabase):**
```php
// Check if person is already booked during this time
$conflicts = $supabase
    ->from('bookings')
    ->select('*, booking_people(*)')
    ->filter('booking_people.person_id', 'eq', $personId)
    ->filter('start_time', 'lt', $endTime)
    ->filter('end_time', 'gt', $startTime)
    ->filter('is_deleted', 'eq', false)
    ->execute();
```

**Files to create:**
- `app/Libraries/ConflictDetection.php`

---

### 8.2 Integrate with Booking Service

**Tasks:**
- [ ] Add conflict checking to `BookingService::createBooking()`
- [ ] Add conflict checking to `BookingService::updateBooking()`
- [ ] Return 422 Unprocessable Entity with conflict details if conflicts found
- [ ] Test conflict detection scenarios

**Response format for conflicts:**
```json
{
  "status": "error",
  "message": "Booking conflicts detected",
  "conflicts": [
    {
      "entity_type": "person",
      "entity_id": 1,
      "entity_name": "John Smith",
      "booking_id": 5,
      "booking_title": "Existing Meeting",
      "booking_start": "2026-02-15 09:30:00",
      "booking_end": "2026-02-15 11:30:00"
    }
  ]
}
```

---

### 8.3 Test Conflict Detection

**Tasks:**
- [ ] Create overlapping bookings for same person (should conflict)
- [ ] Create overlapping bookings for same vehicle (should conflict)
- [ ] Create overlapping bookings for same equipment (should conflict)
- [ ] Create overlapping bookings for different entities (should succeed)
- [ ] Create adjacent bookings (no gap, should succeed)
- [ ] Update booking to create conflict (should fail)
- [ ] Verify conflict response includes all conflicting bookings

---

## Phase 9: Testing & Polish (Week 6)

### 9.1 Database Seeders

**Tasks:**
- [ ] Create `DatabaseSeeder.php` to seed test data:
  - 2 companies
  - 3-5 people per company (mix of admin and members)
  - 3-5 vehicles per company
  - 2-3 equipment items per company
  - 10-15 bookings per company (some with conflicts for testing)
- [ ] Run seeder and verify data
- [ ] Test API with seeded data

**Files to create:**
- `src/utils/seed.js` - Script to seed test data via Supabase

**Commands:**
```bash
node src/utils/seed.js
```

**Note:** Seeding can also be done directly in Supabase SQL Editor using INSERT statements.

---

### 9.2 Unit Tests

**Tasks:**
- [ ] Write unit tests for models:
  - PersonModel CRUD
  - VehicleModel CRUD
  - EquipmentModel CRUD
  - BookingModel CRUD
  - Junction models attach/detach
- [ ] Write unit tests for libraries:
  - JWT helper functions
  - ConflictDetection logic
  - BookingService methods
- [ ] Run tests and verify 80%+ coverage

**Commands:**
```bash
npm test
npm run test:coverage  # if configured
```

---

### 9.3 Integration Tests

**Tasks:**
- [ ] Write integration tests for API endpoints:
  - Authentication flow (register, login, logout)
  - People CRUD with permissions
  - Vehicles CRUD with permissions
  - Equipment CRUD with permissions
  - Bookings CRUD with permissions
  - Conflict detection
  - Multi-tenant isolation
- [ ] Test error responses (400, 401, 403, 404, 422, 500)
- [ ] Test validation failures
- [ ] Run all tests

**Files to create:**
- `tests/Feature/AuthTest.php`
- `tests/Feature/PersonTest.php`
- `tests/Feature/VehicleTest.php`
- `tests/Feature/EquipmentTest.php`
- `tests/Feature/BookingTest.php`
- `tests/Feature/BookingConflictTest.php`

---

### 9.4 Error Handling & Logging

**Tasks:**
- [ ] Standardize error response format across all endpoints
- [ ] Add try-catch blocks in controllers
- [ ] Log errors to `writable/logs/`
- [ ] Test 500 error responses
- [ ] Add custom exception handler

**Standard error response format:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

---

### 9.5 API Documentation

**Tasks:**
- [ ] Document all API endpoints in README or separate API docs
- [ ] Include request/response examples
- [ ] Document authentication requirements
- [ ] Document error codes
- [ ] Create Postman collection for API testing

---

## Timeline Summary (Lean MVP with Express.js + Supabase)

| Phase | Duration | Focus |
|-------|----------|-------|
| 1 | Day 1 | Project setup, Supabase setup, Express.js configuration |
| 2 | Day 2-3 | Authentication system (register, login, logout via Supabase Auth) |
| 3 | Day 3 | Multi-tenancy testing (RLS verification) |
| 4 | Day 4-5 | People management (CRUD, soft delete) |
| 5 | Day 5-6 | Vehicle management (CRUD, soft delete) |
| 6 | Day 6 | Equipment management (CRUD, soft delete) |
| 7 | Day 7-9 | Booking management (CRUD, entity assignments) |
| 8 | Day 9-10 | Conflict detection (time overlap checking) |
| 9 | Day 10-11 | Manual testing, bug fixes, documentation |

**Total Estimated Time:** 1.5-2 weeks for lean MVP

**Why So Fast?**
- Express.js is lightweight and minimal setup
- JavaScript/Node.js is simpler than PHP/CodeIgniter
- Supabase Auth eliminates custom JWT implementation
- RLS policies eliminate manual company filtering code
- No migration files needed (use Supabase SQL Editor)
- No role-based authorization to implement (deferred to P1)
- No Redis caching layer
- Same language as frontend (easier context switching)

---

## Verification Checklist

### Core Functionality
- [ ] Users can register and create a company
- [ ] Users can log in with email/password
- [ ] JWT token is generated and validated correctly
- [ ] Multi-tenant isolation works (users only see their company's data)
- [ ] Admin can create/update/delete people, vehicles, equipment
- [ ] Soft delete works for all entities
- [ ] Undelete functionality works
- [ ] Admin can create bookings with multiple entity assignments
- [ ] Bookings can be filtered by date range and entity type
- [ ] Conflict detection prevents overlapping bookings
- [ ] Member users cannot perform admin actions

### Security
- [ ] Passwords managed by Supabase Auth (secure by default)
- [ ] JWT tokens from Supabase Auth validated on protected routes
- [ ] Protected routes require valid JWT token
- [ ] **Company isolation**: All queries filtered by `company_id` (critical with SERVICE_ROLE_KEY!)
- [ ] SERVICE_ROLE_KEY never exposed to frontend
- [ ] All user input validated and sanitized
- [ ] CORS configured to only allow frontend domain

### Data Integrity
- [ ] Foreign key constraints enforced
- [ ] Soft delete preserves referential integrity
- [ ] Junction tables maintain correct relationships
- [ ] Timestamps (created_at, updated_at, deleted_at) work correctly
- [ ] Validation prevents invalid data

### Performance
- [ ] Database queries optimized (no N+1 problems)
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] Pagination implemented for large result sets (optional for MVP)

### Testing
- [ ] Unit tests pass for all models and libraries
- [ ] Integration tests pass for all endpoints
- [ ] Test coverage > 80%
- [ ] Edge cases tested (empty data, conflicts, invalid tokens, etc.)

---

## Dependencies

**Production Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}
```

**Development Dependencies:**
```json
{
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

**Key Points:**
- **express**: Web framework
- **@supabase/supabase-js**: Official Supabase JavaScript client
- **dotenv**: Environment variable management
- **cors**: CORS middleware
- **nodemon**: Auto-restart server during development
- **jest + supertest**: Testing (P1 priority)

---

## Notes

- This plan assumes a single developer working full-time
- Timeline may vary based on experience with CodeIgniter 4
- Regular testing should be done throughout, not just in Phase 9
- Consider using API testing tools like Postman or Insomnia
- Database migrations should be versioned and never modified after deployment

---

## Environment Configuration

### Development `.env` Settings

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:5173
```

### Getting Supabase Credentials

1. Go to https://supabase.com and create a new project
2. In project dashboard, go to Settings > API
3. Copy the following values:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY` (can be used in frontend)
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **KEEP SECRET - SERVER ONLY!**

**About the Keys:**

- **ANON_KEY**:
  - Safe for frontend use
  - Respects Row Level Security (RLS) policies
  - Users can only access data allowed by RLS

- **SERVICE_ROLE_KEY**:
  - ⚠️ **BYPASSES ALL RLS POLICIES**
  - Full admin access to entire database
  - Must be kept secret (never commit to Git, never expose to frontend)
  - Used in backend for operations that need to bypass RLS (e.g., user registration)
  - **Critical**: You must manually filter by `company_id` in all queries!

**Note:** No JWT secret needed - Supabase manages authentication tokens automatically.

### .gitignore

```
node_modules/
.env
.env.local
.DS_Store
*.log
dist/
build/
```

---

*Plan Version: 1.0*
*Created: January 2026*
*Based on: PRD-backend.md v3.0*
