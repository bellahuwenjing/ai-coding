# Backend Migration to Supabase - Summary of Changes

**Date:** February 1, 2026
**Migration:** CodeIgniter 4 + MySQL → CodeIgniter 4 + Supabase (PostgreSQL + Auth)

---

## What Changed

### Technology Stack

| Component | Before | After |
|-----------|--------|-------|
| Database | MySQL 8 / MariaDB | **Supabase (PostgreSQL)** |
| Authentication | Custom JWT (firebase/php-jwt) | **Supabase Auth (built-in JWT)** |
| Multi-tenancy | Manual company_id filtering | **Supabase RLS (Row Level Security)** |
| Caching | Redis (optional) | **None (deferred to P1)** |
| PHP Library | Database query builder | **supabase-php client** |

---

## Key Simplifications (Lean MVP)

### Removed from MVP (Deferred to P1)
- ❌ Role-based authorization (admin vs member)
- ❌ Redis caching layer
- ❌ Custom JWT implementation
- ❌ Manual company_id filtering in code
- ❌ CodeIgniter migrations (use Supabase SQL Editor)
- ❌ AdminFilter middleware
- ❌ CompanyFilter middleware

### Kept in MVP
- ✅ Authentication (Supabase Auth)
- ✅ Multi-tenant isolation (via RLS)
- ✅ People, Vehicles, Equipment CRUD
- ✅ Bookings with multi-entity assignment
- ✅ Conflict detection
- ✅ Soft delete / undelete

---

## Database Schema Changes

### UUID Instead of AUTO_INCREMENT
```sql
-- Before (MySQL)
id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT

-- After (PostgreSQL)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### JSONB Instead of JSON
```sql
-- Before
skills JSON NULL

-- After
skills JSONB DEFAULT '[]'
```

### TIMESTAMPTZ Instead of TIMESTAMP
```sql
-- Before
created_at TIMESTAMP NULL

-- After
created_at TIMESTAMPTZ DEFAULT NOW()
```

### BOOLEAN Instead of TINYINT
```sql
-- Before
is_deleted TINYINT(1) DEFAULT 0

-- After
is_deleted BOOLEAN DEFAULT FALSE
```

### CHECK Constraints Instead of ENUM
```sql
-- Before
condition ENUM('excellent', 'good', 'fair', 'poor')

-- After
condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor'))
```

### Added RLS Policies
Every table now has Row Level Security policies:
```sql
-- Example: people table
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view people in their company"
    ON people FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));
```

---

## Authentication Flow Changes

### Before (Custom JWT)
1. User logs in with email/password
2. PHP verifies password with `password_verify()`
3. PHP generates JWT with `firebase/php-jwt`
4. JWT includes `{sub: user_id, company_id, role, exp}`
5. AuthFilter validates JWT on protected routes

### After (Supabase Auth)
1. User logs in with email/password
2. Call `$supabase->auth->signInWithPassword()`
3. Supabase validates credentials and returns JWT
4. JWT managed by Supabase (contains `sub: user_id`)
5. SupabaseAuthFilter validates JWT
6. RLS policies extract company_id automatically

---

## File Structure Changes

### Removed Files
- `app/Helpers/jwt_helper.php` - JWT generation/validation
- `app/Filters/CompanyFilter.php` - Manual company scoping
- `app/Filters/AdminFilter.php` - Role checking (deferred to P1)
- `app/Database/Migrations/*` - No CodeIgniter migrations

### New Files
- `app/Config/Supabase.php` - Supabase configuration
- `app/Libraries/SupabaseClient.php` - Supabase PHP client wrapper
- `app/Filters/SupabaseAuthFilter.php` - Verify Supabase JWT

### Modified Files
- `app/Models/*Model.php` - Use SupabaseClient instead of query builder
- `app/Controllers/Auth/*` - Call Supabase Auth methods
- `.env` - Supabase credentials instead of MySQL + JWT secret

---

## Environment Variables

### Before
```env
database.default.hostname = localhost
database.default.database = schedulepro
database.default.username = root
database.default.password = your_password
database.default.DBDriver = MySQLi

jwt.secret = your_jwt_secret
jwt.expire = 86400
```

### After
```env
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

---

## Dependencies

### Before (composer.json)
```json
{
  "require": {
    "codeigniter4/framework": "^4.4",
    "firebase/php-jwt": "^6.0"
  }
}
```

### After (composer.json)
```json
{
  "require": {
    "codeigniter4/framework": "^4.4",
    "supabase/supabase-php": "^1.0"
  }
}
```

---

## Timeline Impact

### Original Plan (MySQL + Custom JWT)
- **6 weeks** for MVP
- Week 1: Database + JWT foundation
- Week 1-2: Custom authentication
- Week 2: Company isolation middleware
- Weeks 2-5: Resource management
- Week 5: Conflict detection
- Week 6: Testing

### New Plan (Supabase)
- **2-3 weeks** for MVP (50% reduction!)
- Day 1-2: Supabase setup + client config
- Day 3-4: Supabase Auth integration
- Day 5: RLS testing
- Day 6-9: Resource management (simplified)
- Day 10-13: Bookings + conflict detection
- Day 14: Testing

**Why Faster?**
- No custom JWT implementation
- No manual company filtering code
- No migration files needed
- No role-based authorization (deferred)
- Built-in authentication

---

## Hosting Recommendations

### Recommended for MVP
1. **Railway** - Free tier, easy PHP support, auto-deploy from GitHub
2. **Render** - Free tier for web services, custom domains
3. **DigitalOcean App Platform** - $5/month, fully managed

### Database Hosting
- ✅ **Supabase cloud** (already hosted, free tier)
- No separate database server needed
- Scales automatically

---

## Next Steps

### To Start Implementation

1. **Create Supabase Project**
   - Sign up at https://supabase.com
   - Create new project
   - Note URL and API keys

2. **Set Up Database**
   - Use Supabase SQL Editor
   - Run CREATE TABLE statements from PRD Section 5
   - Verify RLS policies enabled

3. **Initialize CodeIgniter**
   ```bash
   cd schpro-backend
   composer create-project codeigniter4/appstarter .
   composer require supabase/supabase-php
   ```

4. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add Supabase credentials
   - Configure CORS for frontend

5. **Start Building**
   - Follow `backend-implementation-plan.md`
   - Start with Phase 1: Supabase client setup
   - Then Phase 2: Authentication endpoints

---

## Benefits of Supabase Approach

### Developer Experience
- ✅ Faster development (2-3 weeks vs 6 weeks)
- ✅ Less boilerplate code
- ✅ Automatic security (RLS)
- ✅ Built-in authentication
- ✅ PostgreSQL features (better JSON support)
- ✅ Real-time features available for future

### Production Benefits
- ✅ Managed database (no server maintenance)
- ✅ Automatic backups
- ✅ Point-in-time recovery
- ✅ Database-level security (RLS)
- ✅ Free tier for MVP
- ✅ Scalable infrastructure

### Security Benefits
- ✅ RLS enforced at database level (can't accidentally bypass)
- ✅ JWT managed by Supabase (no custom crypto code)
- ✅ Automatic SQL injection prevention
- ✅ Built-in rate limiting (via Supabase)

---

## Potential Challenges

### Learning Curve
- Supabase PHP library is community-maintained (not official)
- Less documentation than Node.js/JavaScript clients
- May need to read Supabase REST API docs directly

### Workarounds
- Use Supabase REST API directly if PHP client lacks features
- Check Supabase community forums for PHP-specific help
- Fall back to raw SQL queries via PostgreSQL connection if needed

---

## Migration Complete

Both documents updated:
- ✅ `docs/prd/PRD-backend.md` - Now uses Supabase + CodeIgniter
- ✅ `docs/backend-implementation-plan.md` - Updated with Supabase steps

**Ready to start implementation following the updated plan!**
