# Add Endpoint Skill

Automatically generate a complete REST API endpoint following SchedulePro backend patterns.

## What It Does

Creates a full CRUD endpoint with:
- Controller file with 6 standard methods (getAll, getOne, create, update, softDelete, restore)
- Routes file with RESTful route definitions
- Updates app.js to register the new routes
- Follows all existing codebase patterns (multi-tenant, soft delete, JWT auth)

## Usage

```bash
/add-endpoint <resource_name>
```

### Example

```bash
/add-endpoint booking
```

This creates:
- `src/controllers/booking.controller.js`
- `src/routes/booking.routes.js`
- Updates `src/app.js`

### Routes Created

```
GET    /api/bookings           - List all (company-scoped)
POST   /api/bookings           - Create new
GET    /api/bookings/:id       - Get by ID
PUT    /api/bookings/:id       - Update
DELETE /api/bookings/:id       - Soft delete
POST   /api/bookings/:id/restore - Restore deleted
```

## Patterns Applied

✅ **Multi-tenant**: All queries automatically scoped to `company_id` from JWT token
✅ **Soft delete**: Uses `is_deleted` flag instead of hard deletes
✅ **JWT auth**: All routes protected with `verifyToken` middleware
✅ **Supabase**: Uses `supabaseAdmin` for all database operations
✅ **Error handling**: Consistent error responses and status codes
✅ **Validation**: Required field validation and unique constraint handling

## Interactive Prompts

The skill will ask you:
1. **Table fields** - What fields does the resource table have?
2. **Required fields** - Which fields are required for creation?
3. **Unique constraints** - Are there unique fields (e.g., serial_number)?

## Generated Code Structure

### Controller Methods

Each controller exports 6 methods:

```javascript
exports.getAll       // GET /api/{resource}s
exports.getOne       // GET /api/{resource}s/:id
exports.create       // POST /api/{resource}s
exports.update       // PUT /api/{resource}s/:id
exports.softDelete   // DELETE /api/{resource}s/:id
exports.restore      // POST /api/{resource}s/:id/restore
```

### Standard Response Format

```json
{
  "status": "success" | "error",
  "message": "Operation description",
  "data": {}
}
```

### HTTP Status Codes

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found
- `500` - Internal server error

## Prerequisites

Before using this skill, ensure:
1. The corresponding table exists in Supabase with:
   - `id` (UUID, primary key)
   - `company_id` (UUID, foreign key to companies)
   - `is_deleted` (boolean, default false)
   - `deleted_at` (timestamptz, nullable)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())
   - Your custom fields

2. RLS policies are set up (or disabled for MVP)

## After Generation

1. ✅ Files created in correct locations
2. ✅ Routes registered in app.js
3. 🧪 Test endpoints with curl/Postman
4. 📝 Update `API-TESTS.md` with test cases
5. 🔄 Restart backend server to load new routes

## Examples

### Creating a Booking Endpoint

```bash
/add-endpoint booking
```

**Questions:**
- Fields: `title, location, start_time, end_time, notes`
- Required: `title, start_time, end_time`
- Unique: No

**Result:**
- Controller with booking logic
- Routes for `/api/bookings`
- All operations company-scoped and soft-delete enabled

### Creating a Customer Endpoint

```bash
/add-endpoint customer
```

**Questions:**
- Fields: `name, email, phone, company_name, address`
- Required: `name, email`
- Unique: `email` (per company)

**Result:**
- Controller with customer logic
- Duplicate email validation
- Routes for `/api/customers`

## Naming Conventions

- **Resource name**: Singular, lowercase (e.g., `booking`, `customer`)
- **Table name**: Plural (e.g., `bookings`, `customers`)
- **Route path**: Plural (e.g., `/api/bookings`)
- **Variable name**: Singular (e.g., `booking`, `customer`)
- **Controller file**: Singular (e.g., `booking.controller.js`)
- **Routes file**: Singular (e.g., `booking.routes.js`)

## Notes

- Based on analysis of existing controllers: `people`, `vehicles`, `equipment`
- Follows Express.js + Supabase patterns
- Compatible with SchedulePro multi-tenant architecture
- All code generated follows existing code style and error handling
