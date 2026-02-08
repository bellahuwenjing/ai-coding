---
name: add-endpoint
description: Generate a new REST endpoint following SchedulePro backend patterns (controller + routes + registration)
tools: Read, Write, Edit, Bash, AskUserQuestion
disable-model-invocation: false
---

# Add Endpoint Skill

Generate a complete CRUD endpoint for the SchedulePro backend that follows established codebase patterns.

## Overview

This skill creates:
- Controller file with 6 standard methods (getAll, getOne, create, update, softDelete, restore)
- Routes file with RESTful route definitions
- Updates app.js to register the new routes
- Follows all existing patterns: multi-tenant, soft delete, JWT auth, Supabase

## Usage

When invoked with a resource name (e.g., `booking`, `customer`), this skill will:

1. Ask the user about table schema, required fields, and unique constraints
2. Generate a controller file at `schpro-backend/src/controllers/{resource}.controller.js`
3. Generate a routes file at `schpro-backend/src/routes/{resource}.routes.js`
4. Update `schpro-backend/src/app.js` to register the routes

## Step 1: Gather Information

Ask the user for the following information using AskUserQuestion:

**Question 1 - Table Schema:**
- Header: "Table fields"
- Question: "What fields does the {{resource_name}} table have? (comma-separated, e.g. 'title, description, status')"
- Note: Don't include standard fields (id, company_id, is_deleted, deleted_at, created_at, updated_at)

**Question 2 - Required Fields:**
- Header: "Required"
- Question: "Which fields are required for creating a {{resource_name}}?"

**Question 3 - Unique Constraints:**
- Header: "Uniqueness"
- Question: "Are there any unique constraints per company? (e.g., serial_number, email)"

## Step 2: Generate Controller

Create `schpro-backend/src/controllers/{{resource_name}}.controller.js` following this pattern:

### Controller Structure

```javascript
const { supabaseAdmin } = require('../services/supabase.service');

// 1. getAll - GET /api/{{resource_name}}s
exports.getAll = async (req, res) => {
  const companyId = req.user.company_id;
  // Query with .eq('company_id', companyId).eq('is_deleted', false)
  // Order by created_at descending
};

// 2. getOne - GET /api/{{resource_name}}s/:id
exports.getOne = async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.company_id;
  // Query with .eq('id', id).eq('company_id', companyId).eq('is_deleted', false).single()
};

// 3. create - POST /api/{{resource_name}}s
exports.create = async (req, res) => {
  // Extract fields from req.body
  // Validate required fields
  // Handle enum validation if needed
  // Build insertData with company_id
  // Optional fields use: field || null
  // Handle duplicate errors (error.code === '23505')
  // Return 201 status
};

// 4. update - PUT /api/{{resource_name}}s/:id
exports.update = async (req, res) => {
  // Extract fields from req.body
  // Validate required fields
  // Build updateData with updated_at: new Date().toISOString()
  // Query with .eq('id', id).eq('company_id', companyId).eq('is_deleted', false)
  // Handle duplicate errors
  // Check if result is null (404)
};

// 5. softDelete - DELETE /api/{{resource_name}}s/:id
exports.softDelete = async (req, res) => {
  // Update is_deleted: true, deleted_at: new Date().toISOString()
  // Query with .eq('id', id).eq('company_id', companyId).eq('is_deleted', false)
};

// 6. restore - POST /api/{{resource_name}}s/:id/restore
exports.restore = async (req, res) => {
  // Update is_deleted: false, deleted_at: null
  // Query with .eq('id', id).eq('company_id', companyId).eq('is_deleted', true)
};
```

### Critical Controller Patterns

1. **Always** filter by `company_id` from `req.user`
2. **Always** filter `is_deleted = false` for active records
3. **Always** validate required fields before insert/update
4. **Always** handle duplicate errors (error.code === '23505') for unique constraints
5. **Always** use `supabaseAdmin` for all database operations
6. **Always** set `updated_at` in update operations
7. Use `|| null` for optional fields in insert/update
8. Table name is pluralized: `{{resource_name}}s`
9. Variable name is singular: `{{resource_name}}`
10. Response format: `{status: 'success'|'error', message: string, data: object}`
11. HTTP status codes: 200 (success), 201 (created), 400 (bad request), 404 (not found), 500 (error)

## Step 3: Generate Routes

Create `schpro-backend/src/routes/{{resource_name}}.routes.js` with this exact pattern:

```javascript
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {{resource_name}}Controller = require('../controllers/{{resource_name}}.controller');

// All routes require authentication
router.use(verifyToken);

// CRUD routes
router.get('/', {{resource_name}}Controller.getAll);
router.post('/', {{resource_name}}Controller.create);
router.get('/:id', {{resource_name}}Controller.getOne);
router.put('/:id', {{resource_name}}Controller.update);
router.delete('/:id', {{resource_name}}Controller.softDelete);

// Restore deleted {{resource_name}} (admin only for now)
router.post('/:id/restore', {{resource_name}}Controller.restore);

module.exports = router;
```

## Step 4: Update app.js

Read `schpro-backend/src/app.js` and make two changes:

1. **Add import** at top with other route imports:
   ```javascript
   const {{resource_name}}Routes = require('./routes/{{resource_name}}.routes');
   ```

2. **Register route** with other app.use() calls:
   ```javascript
   app.use('/api/{{resource_name}}s', {{resource_name}}Routes);
   ```

Follow the exact placement pattern of existing routes.

## Step 5: Output Summary

After generating files, provide this summary:

```
✅ Endpoint created for: {{resource_name}}

📁 Files created/modified:
  ✓ src/controllers/{{resource_name}}.controller.js (NEW)
  ✓ src/routes/{{resource_name}}.routes.js (NEW)
  ✓ src/app.js (MODIFIED)

🔗 Available endpoints:
  GET    /api/{{resource_name}}s           - List all
  POST   /api/{{resource_name}}s           - Create new
  GET    /api/{{resource_name}}s/:id       - Get by ID
  PUT    /api/{{resource_name}}s/:id       - Update
  DELETE /api/{{resource_name}}s/:id       - Soft delete
  POST   /api/{{resource_name}}s/:id/restore - Restore deleted

✨ Patterns applied:
  ✓ Multi-tenant (company_id scoping)
  ✓ Soft delete (is_deleted flag)
  ✓ JWT authentication
  ✓ Standard error handling
  ✓ Supabase Admin client
  ✓ Required field validation
  [✓] Unique constraint validation (if applicable)

📝 Next steps:
  1. Ensure the {{resource_name}}s table exists in Supabase
  2. Restart backend: cd schpro-backend && npm run dev
  3. Test endpoints with curl or Postman
  4. Update API-TESTS.md with test cases
```

## Example Controllers to Reference

Before generating code, read these existing controllers to ensure consistency:
- `schpro-backend/src/controllers/people.controller.js`
- `schpro-backend/src/controllers/vehicles.controller.js`
- `schpro-backend/src/controllers/equipment.controller.js`

Match their:
- Error handling patterns
- Validation approach
- Response structure
- Query patterns
- Comment style

## Variable Replacements

- `{{resource_name}}` - singular, lowercase (e.g., "booking")
- `{{resource_name_capitalized}}` - singular, capitalized (e.g., "Booking")
- `{{resource_name}}s` - plural, lowercase (e.g., "bookings")

## Important Notes

- Pluralization: Routes use plural (`/api/bookings`), table is plural (`bookings`), variable is singular (`booking`)
- Security: Always filter by `company_id` and `is_deleted`
- Timestamps: Auto-set `updated_at` in updates, rely on DB defaults for `created_at`
- Validation: Check required fields BEFORE database operations
- Do NOT deviate from established patterns
