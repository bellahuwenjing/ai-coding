# Database Migrations

This directory contains all SQL migration scripts for the SchedulePro database, organized chronologically.

## Migration Files

### 001_initial_schema.sql
**Status:** ✅ Complete database schema with RLS policies
**When to run:** First time database setup (fresh install)

**What it creates:**
- All tables: companies, people, vehicles, equipment, bookings, junction tables
- Row Level Security (RLS) policies for multi-tenancy
- Helper function `user_company_id()` for RLS
- Indexes for performance
- Triggers for `updated_at` timestamps
- `requirements` JSONB column in bookings table

**Note:** This is the canonical schema. Includes DROP statements, so it will reset the database if run on existing data.

---

### 002_make_user_id_nullable.sql
**Status:** Migration for existing databases
**When to run:** If you created the database before `user_id` was made nullable

**What it does:**
- Makes `people.user_id` nullable (was previously NOT NULL)
- Allows creating person records that aren't linked to auth users (non-login resources)

**Rollback:** Not provided (reversing would require migrating data)

---

### 003_add_requirements_to_bookings.sql
**Status:** Migration for existing databases
**When to run:** If your database doesn't have the `requirements` column yet

**What it does:**
- Adds `requirements JSONB DEFAULT '{}'` to bookings table
- Existing bookings will have `requirements = {}`
- Enables AI-powered optimal scheduling feature

**Rollback:** `rollbacks/003_rollback_requirements.sql` (⚠️ deletes all requirements data)

---

## Directory Structure

```
migrations/
├── README.md                          ← You are here
├── 001_initial_schema.sql             ← Full schema (fresh setup)
├── 002_make_user_id_nullable.sql      ← Migration #1
├── 003_add_requirements_to_bookings.sql ← Migration #2
└── rollbacks/
    └── 003_rollback_requirements.sql  ← Rollback for #2
```

---

## How to Run Migrations

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of the migration file
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success in the output panel

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Fresh database setup
supabase db execute --file migrations/001_initial_schema.sql

# Run specific migration
supabase db execute --file migrations/002_make_user_id_nullable.sql
supabase db execute --file migrations/003_add_requirements_to_bookings.sql

# Rollback (if needed)
supabase db execute --file migrations/rollbacks/003_rollback_requirements.sql
```

### Option 3: Direct PostgreSQL Connection

If connecting directly to the PostgreSQL database:

```bash
psql -h <db-host> -U postgres -d postgres -f migrations/001_initial_schema.sql
```

---

## Which Migrations Do I Need?

### Scenario 1: Brand new database (never had SchedulePro)
**Run:** `001_initial_schema.sql` only

This creates everything from scratch with the latest schema including the requirements column.

---

### Scenario 2: Existing database created before requirements column
**Run:** `003_add_requirements_to_bookings.sql`

This adds the requirements column to your existing bookings table without affecting existing data.

---

### Scenario 3: Existing database created before user_id was nullable
**Run:**
1. `002_make_user_id_nullable.sql` (if needed)
2. `003_add_requirements_to_bookings.sql` (if needed)

Check if you need #2 by running:
```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'people' AND column_name = 'user_id';
```
If `is_nullable = 'NO'`, run migration 002.

Check if you need #3 by running:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'requirements';
```
If no rows returned, run migration 003.

---

## Verification Queries

### Verify 001 (initial schema) ran successfully:
```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('companies', 'people', 'vehicles', 'equipment', 'bookings',
                   'booking_people', 'booking_vehicles', 'booking_equipment')
ORDER BY table_name;

-- Should return 8 rows
```

### Verify 002 (user_id nullable) ran successfully:
```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'people' AND column_name = 'user_id';

-- is_nullable should be 'YES'
```

### Verify 003 (requirements column) ran successfully:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'requirements';

-- Should return: requirements | jsonb | '{}'::jsonb

-- Check existing bookings have default empty object
SELECT id, title, requirements FROM bookings LIMIT 5;
-- All should show requirements: {}
```

---

## Requirements Structure Reference

The `requirements` JSONB column stores structured resource requirements for AI-powered scheduling:

```json
{
  "people": [
    {
      "role": "welder",
      "skills": ["welding", "rigging"],
      "certifications": ["AWS D1.1"],
      "quantity": 2
    }
  ],
  "vehicles": [
    {
      "type": "van",
      "min_capacity": 8,
      "quantity": 1
    }
  ],
  "equipment": [
    {
      "type": "welder",
      "min_condition": "good",
      "quantity": 2
    }
  ]
}
```

**Field descriptions:**
- `people[].role` (string, optional) — Job title
- `people[].skills` (array, optional) — Required skills
- `people[].certifications` (array, optional) — Required certifications
- `people[].quantity` (number, required) — How many people needed
- `vehicles[].type` (string, optional) — Vehicle type keyword
- `vehicles[].min_capacity` (number, optional) — Minimum capacity
- `vehicles[].quantity` (number, required) — How many vehicles needed
- `equipment[].type` (string, optional) — Equipment type keyword
- `equipment[].min_condition` (string, optional) — Minimum condition: "excellent"|"good"|"fair"|"poor"
- `equipment[].quantity` (number, required) — How many equipment items needed

See `docs/prd/PRD-backend.md` section 5.5 and `docs/prd/PRD-hybrid-optimal-scheduling.md` for full documentation.

---

## Migration Best Practices

1. **Backup first:** Always back up your database before running migrations
2. **Test locally:** Run migrations on a local/staging database first
3. **Read the SQL:** Review the migration file before executing
4. **Verify:** Check the migration worked as expected after running
5. **Don't modify:** Once run, migrations should not be edited (create new ones instead)
6. **Rollback plan:** Know how to rollback before running (check rollbacks/ folder)
7. **Run in order:** If running multiple migrations, run them in numerical order (001, 002, 003)

---

## Adding New Migrations

When creating new migrations:

1. **Naming:** Use format `NNN_descriptive_name.sql` (e.g., `004_add_booking_status.sql`)
2. **Number:** Increment from the last migration (current: 003, next: 004)
3. **Content:** Include:
   - Header comment describing what it does
   - The actual SQL changes
   - Verification queries in comments
4. **Rollback:** Create matching `rollbacks/NNN_rollback_description.sql` if reversible
5. **Update README:** Add entry to this README documenting the new migration
6. **Test:** Test on local/staging database before production

---

## Troubleshooting

**Error: "relation already exists"**
- Migration was already run. Check with verification queries.
- If running 001_initial_schema.sql, it will drop existing tables first (by design).

**Error: "permission denied for schema auth"**
- RLS helper function must be in `public` schema, not `auth`. Already handled in 001_initial_schema.sql.

**Error: "column already exists"**
- Migration was already run. Verify with:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'bookings' AND column_name = 'requirements';
  ```

**Error: "cannot drop because other objects depend on it"**
- Use `CASCADE` in DROP statements (already included in 001_initial_schema.sql)
