# Backend Implementation Progress

## Architecture Decisions

### Decision: Separate User and People Concerns (2026-02-06)

**Original Design:**
- All people in the `people` table would also be users with login accounts
- `user_id` was NOT NULL (required for all people records)
- Tight coupling between authentication and schedulable resources

**New Design (MVP):**
- `user_id` is now nullable in the `people` table
- Two types of people records:
  1. **Users**: People with `user_id` (created during registration) - can login
  2. **Resources**: People without `user_id` (created manually) - just schedulable resources
- Separation of concerns: authentication vs resource scheduling

**Rationale:**
- Original design was too complicated to implement for MVP
- Simpler to allow creating schedulable people without requiring user accounts
- Not all schedulable resources need system access (contractors, vendors, etc.)
- Can add "Convert to User" feature later if needed

**Migration Applied:**
```sql
ALTER TABLE people ALTER COLUMN user_id DROP NOT NULL;
```

---

## Implementation Status

### Phase 1: Authentication ✅ COMPLETE
- [x] JWT authentication with Supabase
- [x] Register endpoint (creates company + admin user + person record)
- [x] Login endpoint
- [x] Logout endpoint
- [x] Get current user endpoint
- [x] Auth middleware for protected routes
- [x] Separate `supabaseAuth` (ANON_KEY) and `supabaseAdmin` (SERVICE_ROLE_KEY) clients

**Key Fix:**
- Used ANON_KEY for auth operations (signUp, signInWithPassword)
- Used SERVICE_ROLE_KEY for database operations (bypasses RLS)

### Phase 2: People Management ✅ COMPLETE
- [x] GET /api/people - List all people (filtered by company)
- [x] POST /api/people - Create new person
- [x] GET /api/people/:id - Get single person
- [x] PUT /api/people/:id - Update person
- [x] DELETE /api/people/:id - Soft delete person
- [x] POST /api/people/:id/restore - Restore deleted person

**Fields Supported:**
- Required: `name`, `email`
- Optional: `phone`, `skills` (JSONB array), `certifications` (JSONB array), `hourly_rate`
- System: `company_id`, `user_id` (nullable), `is_deleted`, timestamps

**Security:**
- All endpoints require authentication (verifyToken middleware)
- All queries automatically filtered by `req.user.company_id` (multi-tenant isolation)

### Phase 3: Vehicles Management ✅ COMPLETE
- [x] GET /api/vehicles - List all vehicles (filtered by company)
- [x] POST /api/vehicles - Create new vehicle
- [x] GET /api/vehicles/:id - Get single vehicle
- [x] PUT /api/vehicles/:id - Update vehicle
- [x] DELETE /api/vehicles/:id - Soft delete vehicle
- [x] POST /api/vehicles/:id/restore - Restore deleted vehicle

**Fields Supported:**
- Required: `name`, `license_plate`
- Optional: `make`, `model`, `year` (INTEGER), `capacity` (INTEGER), `notes`
- System: `company_id`, `is_deleted`, timestamps
- Unique constraint: `license_plate` per company

**Security:**
- All endpoints require authentication (verifyToken middleware)
- All queries automatically filtered by `req.user.company_id` (multi-tenant isolation)
- Duplicate license plate validation (returns 400 error)

### Phase 4: Equipment Management ✅ COMPLETE
- [x] GET /api/equipment - List all equipment (filtered by company)
- [x] POST /api/equipment - Create new equipment
- [x] GET /api/equipment/:id - Get single equipment
- [x] PUT /api/equipment/:id - Update equipment
- [x] DELETE /api/equipment/:id - Soft delete equipment
- [x] POST /api/equipment/:id/restore - Restore deleted equipment

**Fields Supported:**
- Required: `name`, `serial_number`
- Optional: `type`, `condition` (enum: 'excellent', 'good', 'fair', 'poor'), `notes`
- System: `company_id`, `is_deleted`, timestamps
- Unique constraint: `serial_number` per company

**Security:**
- All endpoints require authentication (verifyToken middleware)
- All queries automatically filtered by `req.user.company_id` (multi-tenant isolation)
- Duplicate serial number validation (returns 400 error)
- Condition field validation against allowed values

### Phase 5: Bookings Management ⏳ TODO
- [ ] CRUD endpoints for bookings
- [ ] Many-to-many relationships (booking_people, booking_vehicles, booking_equipment)
- [ ] Conflict detection library
- [ ] Fields: title, location, start_time, end_time, description, status

---

## Technical Notes

### Database Schema
- Using Supabase PostgreSQL
- RLS (Row Level Security) disabled for MVP
- Manual company_id filtering in backend for security
- All tables have soft delete support (`is_deleted`, `deleted_at`)

### API Response Format
All API responses follow this structure:
```json
{
  "status": "success" | "error",
  "message": "Description",
  "data": { ... } | [ ... ]
}
```

Frontend Backbone collections use `parse(response)` to extract `response.data`.

### Known Issues
- None currently

### Next Steps
1. Build Bookings CRUD endpoints with conflict detection
2. Add validation and error handling improvements
3. Add database seeders for testing
