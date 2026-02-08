# Add New Endpoint Skill

You are tasked with creating a new REST API endpoint for the SchedulePro backend that follows established codebase patterns.

## Your Task

Generate a complete CRUD endpoint for the resource: **{{resource_name}}**

## Required Steps

### 1. Gather Information from User

Ask the user for the following information using AskUserQuestion:

**Question 1: Table Schema**
- Header: "Table fields"
- Question: "What fields does the {{resource_name}} table have? (Provide as comma-separated list, e.g., 'title, description, status, priority')"
- Options:
  - Label: "Standard fields" / Description: "Common CRUD fields like name, description, status"
  - Label: "Complex schema" / Description: "Multiple fields with specific types and constraints"

**Question 2: Required Fields**
- Header: "Required"
- Question: "Which fields are required for creating a {{resource_name}}?"
- Options:
  - Label: "All fields" / Description: "All fields are required"
  - Label: "Some fields" / Description: "Only certain fields are required"

**Question 3: Unique Constraints**
- Header: "Uniqueness"
- Question: "Are there any unique constraints (e.g., unique serial_number per company)?"
- Options:
  - Label: "Yes" / Description: "Has unique fields that need validation"
  - Label: "No" / Description: "No unique constraints"

### 2. Generate Controller File

**Location**: `schpro-backend/src/controllers/{{resource_name}}.controller.js`

**Pattern to follow** (based on existing controllers):

```javascript
const { supabaseAdmin } = require('../services/supabase.service');

/**
 * Get all {{resource_name}}s for the user's company
 * GET /api/{{resource_name}}s
 */
exports.getAll = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    if (!companyId) {
      return res.status(400).json({
        status: 'error',
        message: 'Company ID not found. Please login again.'
      });
    }

    // Get all non-deleted {{resource_name}}s for this company
    const { data: {{resource_name}}s, error } = await supabaseAdmin
      .from('{{resource_name}}s')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get {{resource_name}}s error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch {{resource_name}}s'
      });
    }

    res.json({
      status: 'success',
      data: {{resource_name}}s
    });

  } catch (error) {
    console.error('Get {{resource_name}}s error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get single {{resource_name}} by ID
 * GET /api/{{resource_name}}s/:id
 */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const { data: {{resource_name}}, error } = await supabaseAdmin
      .from('{{resource_name}}s')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .single();

    if (error || !{{resource_name}}) {
      return res.status(404).json({
        status: 'error',
        message: '{{resource_name_capitalized}} not found'
      });
    }

    res.json({
      status: 'success',
      data: {{resource_name}}
    });

  } catch (error) {
    console.error('Get {{resource_name}} error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new {{resource_name}}
 * POST /api/{{resource_name}}s
 */
exports.create = async (req, res) => {
  try {
    const { /* FIELDS FROM USER INPUT */ } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!/* REQUIRED FIELDS FROM USER INPUT */) {
      return res.status(400).json({
        status: 'error',
        message: '/* REQUIRED FIELDS */ are required'
      });
    }

    // Add any enum validation if needed (like equipment's condition field)

    // Build insert object
    const insertData = {
      company_id: companyId,
      /* MAP FIELDS - required fields as-is, optional fields with || null */
    };

    // Create {{resource_name}}
    const { data: {{resource_name}}, error } = await supabaseAdmin
      .from('{{resource_name}}s')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Create {{resource_name}} error:', error);

      // Handle duplicate constraint error if unique fields exist
      if (error.code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: '{{resource_name_capitalized}} with this /* UNIQUE FIELD */ already exists in your company'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to create {{resource_name}}'
      });
    }

    res.status(201).json({
      status: 'success',
      message: '{{resource_name_capitalized}} created successfully',
      data: {{resource_name}}
    });

  } catch (error) {
    console.error('Create {{resource_name}} error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Update {{resource_name}}
 * PUT /api/{{resource_name}}s/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { /* FIELDS FROM USER INPUT */ } = req.body;
    const companyId = req.user.company_id;

    // Validate required fields
    if (!/* REQUIRED FIELDS FROM USER INPUT */) {
      return res.status(400).json({
        status: 'error',
        message: '/* REQUIRED FIELDS */ are required'
      });
    }

    // Build update object
    const updateData = {
      /* MAP FIELDS */,
      updated_at: new Date().toISOString()
    };

    // For optional fields, use conditional assignment like in people.controller.js:
    // if (field !== undefined) updateData.field = field;

    // Update {{resource_name}} (only if it belongs to user's company)
    const { data: {{resource_name}}, error } = await supabaseAdmin
      .from('{{resource_name}}s')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Update {{resource_name}} Supabase error:', error);

      // Handle duplicate constraint error if unique fields exist
      if (error.code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: '{{resource_name_capitalized}} with this /* UNIQUE FIELD */ already exists in your company'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Failed to update {{resource_name}}',
        details: error.message
      });
    }

    if (!{{resource_name}}) {
      console.error('{{resource_name_capitalized}} not found for update:', { id, companyId });
      return res.status(404).json({
        status: 'error',
        message: '{{resource_name_capitalized}} not found or does not belong to your company'
      });
    }

    res.json({
      status: 'success',
      message: '{{resource_name_capitalized}} updated successfully',
      data: {{resource_name}}
    });

  } catch (error) {
    console.error('Update {{resource_name}} error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Soft delete {{resource_name}}
 * DELETE /api/{{resource_name}}s/:id
 */
exports.softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Soft delete by setting is_deleted flag
    const { data: {{resource_name}}, error } = await supabaseAdmin
      .from('{{resource_name}}s')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error || !{{resource_name}}) {
      return res.status(404).json({
        status: 'error',
        message: '{{resource_name_capitalized}} not found or already deleted'
      });
    }

    res.json({
      status: 'success',
      message: '{{resource_name_capitalized}} deleted successfully',
      data: {{resource_name}}
    });

  } catch (error) {
    console.error('Delete {{resource_name}} error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Restore deleted {{resource_name}}
 * POST /api/{{resource_name}}s/:id/restore
 */
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Restore by unsetting is_deleted flag
    const { data: {{resource_name}}, error } = await supabaseAdmin
      .from('{{resource_name}}s')
      .update({
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .eq('is_deleted', true)
      .select()
      .single();

    if (error || !{{resource_name}}) {
      return res.status(404).json({
        status: 'error',
        message: '{{resource_name_capitalized}} not found or not deleted'
      });
    }

    res.json({
      status: 'success',
      message: '{{resource_name_capitalized}} restored successfully',
      data: {{resource_name}}
    });

  } catch (error) {
    console.error('Restore {{resource_name}} error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
```

**IMPORTANT Controller Patterns:**
1. **Always** filter by `company_id` from `req.user`
2. **Always** filter `is_deleted = false` for active records
3. **Always** validate required fields before insert/update
4. **Always** handle duplicate errors (error.code === '23505') for unique constraints
5. **Always** use `supabaseAdmin` for all database operations
6. **Always** set `updated_at` in update operations
7. Use `|| null` for optional fields in insert/update
8. Table name is pluralized: `{{resource_name}}s`
9. Variable name is singular: `{{resource_name}}`

### 3. Generate Routes File

**Location**: `schpro-backend/src/routes/{{resource_name}}.routes.js`

**Exact pattern** (this is identical for all resources):

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

### 4. Update app.js

**Location**: `schpro-backend/src/app.js`

Add two lines:
1. Import route at top with other imports:
   ```javascript
   const {{resource_name}}Routes = require('./routes/{{resource_name}}.routes');
   ```

2. Register route with other app.use() calls:
   ```javascript
   app.use('/api/{{resource_name}}s', {{resource_name}}Routes);
   ```

Follow the exact placement pattern of existing routes (e.g., people, vehicles, equipment).

### 5. Summary Output

After generating files, provide this summary to the user:

```
✅ Endpoint created for: {{resource_name}}

📁 Files created/modified:
  - src/controllers/{{resource_name}}.controller.js (NEW)
  - src/routes/{{resource_name}}.routes.js (NEW)
  - src/app.js (MODIFIED)

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
  [✓] Unique constraint validation (if applicable)

📝 Next steps:
  1. Ensure the {{resource_name}}s table exists in Supabase
  2. Test endpoints using curl or Postman
  3. Update API-TESTS.md with test cases
```

## Critical Rules

1. **DO NOT deviate from patterns** - Follow existing controllers exactly
2. **Pluralization**: Routes use plural (`/api/bookings`), table name is plural (`bookings`), variable is singular (`booking`)
3. **Capitalization**: Use proper capitalization in messages (e.g., "Booking created successfully")
4. **Error codes**: Use correct HTTP status codes (200, 201, 400, 401, 404, 500)
5. **Response format**: Always use `{status, message, data}` structure
6. **Security**: Always filter by `company_id` and `is_deleted`
7. **Timestamps**: Auto-set `updated_at` in updates, rely on DB defaults for `created_at`
8. **Validation**: Check required fields BEFORE database operations
9. **Error handling**: Handle both Supabase errors and not-found cases separately

## Variable Replacements

- `{{resource_name}}` - singular, lowercase (e.g., "booking")
- `{{resource_name_capitalized}}` - singular, capitalized (e.g., "Booking")
- `{{resource_name}}s` - plural, lowercase (e.g., "bookings")

## Examples

Example invocation: `/add-endpoint booking`

This would create:
- `src/controllers/booking.controller.js` with all CRUD methods
- `src/routes/booking.routes.js` with route definitions
- Update `src/app.js` to register routes

Routes created:
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id`
- `DELETE /api/bookings/:id`
- `POST /api/bookings/:id/restore`

All operations automatically scoped to user's company via JWT token.
