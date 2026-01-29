# Backend Implementation Plan
## SchedulePro CodeIgniter 4 + MySQL Multi-Tenant API

---

## Overview

This plan outlines the implementation strategy for building the SchedulePro backend API using CodeIgniter 4 and MySQL with multi-tenant architecture.

**Based on:** `docs/prd/PRD-backend.md` v3.0

---

## Phase 1: Project Setup & Database (Week 1)

### 1.1 Initialize CodeIgniter 4 Project

**Tasks:**
- [ ] Create CodeIgniter 4 project using Composer
- [ ] Configure environment variables (.env file)
- [ ] Set up database connection
- [ ] Install dependencies (JWT library, etc.)
- [ ] Test basic server startup
- [ ] Configure CORS for frontend connection

**Commands:**
```bash
cd schpro-backend
composer create-project codeigniter4/appstarter .
composer require firebase/php-jwt
cp env .env
# Edit .env with database credentials and JWT secret
php spark serve
```

**Files to configure:**
- `.env` - Environment configuration
- `app/Config/App.php` - Base URL, timezone
- `app/Config/Database.php` - Database connection (reads from .env)
- `app/Config/Cors.php` - CORS configuration for frontend

---

### 1.2 Database Setup & Initial Migration

**Tasks:**
- [ ] Create MySQL database
- [ ] Create migration for `companies` table
- [ ] Create migration for `people` table (unified authentication + resource)
- [ ] Create migration for `vehicles` table
- [ ] Create migration for `equipment` table
- [ ] Create migration for `bookings` table
- [ ] Create migrations for junction tables:
  - `booking_people`
  - `booking_vehicles`
  - `booking_equipment`
- [ ] Run migrations
- [ ] Verify tables created successfully

**Commands:**
```bash
# Create database
mysql -u root -p
CREATE DATABASE schedulepro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Run migrations
php spark migrate
php spark migrate:status
```

**Files to create:**
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateCompaniesTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreatePeopleTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateVehiclesTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateEquipmentTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateBookingsTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateBookingPeopleTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateBookingVehiclesTable.php`
- `app/Database/Migrations/YYYY-MM-DD-HHMMSS_CreateBookingEquipmentTable.php`

---

### 1.3 JWT Authentication Foundation

**Tasks:**
- [ ] Create JWT helper functions (generate, validate, decode)
- [ ] Create `AuthFilter.php` - Validate JWT token on protected routes
- [ ] Create `CompanyFilter.php` - Ensure company isolation
- [ ] Create `AdminFilter.php` - Restrict admin-only endpoints
- [ ] Configure filters in `app/Config/Filters.php`
- [ ] Test JWT generation and validation manually

**Files to create:**
- `app/Helpers/jwt_helper.php` - JWT utility functions
- `app/Filters/AuthFilter.php`
- `app/Filters/CompanyFilter.php`
- `app/Filters/AdminFilter.php`

**Files to configure:**
- `app/Config/Filters.php` - Register filters

---

### 1.4 Base Models & Entities

**Tasks:**
- [ ] Create `CompanyModel.php` with base CRUD
- [ ] Create `Company` entity
- [ ] Create base model trait for company scoping (optional)
- [ ] Test company creation manually

**Files to create:**
- `app/Models/CompanyModel.php`
- `app/Entities/Company.php`

---

## Phase 2: Authentication System (Week 1-2)

### 2.1 Registration Endpoint

**Tasks:**
- [ ] Create `RegisterController.php`
- [ ] Implement `POST /api/auth/register` endpoint
  - Validate company name, email, password
  - Create company record
  - Create admin person record (first user in company)
  - Hash password using `password_hash()`
  - Return success message
- [ ] Add validation rules for registration
- [ ] Test registration with Postman/Insomnia

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
    "company_id": 1,
    "user_id": 1
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
  - Find person by email
  - Verify password using `password_verify()`
  - Generate JWT token with payload (sub, company_id, role, exp)
  - Return token and user data
- [ ] Add validation rules for login
- [ ] Test login flow

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
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "person": {
      "id": 1,
      "company_id": 1,
      "name": "John Doe",
      "email": "john@acme.com",
      "role": "admin"
    }
  }
}
```

**Files to create:**
- `app/Controllers/Auth/LoginController.php`

---

### 2.3 Logout Endpoint (Optional)

**Tasks:**
- [ ] Create `LogoutController.php`
- [ ] Implement `POST /api/auth/logout` endpoint (stateless, client-side token removal)
- [ ] Return success message

**Note:** Since we're using stateless JWT, logout is primarily handled client-side by removing the token from storage. The backend endpoint is optional but can be used for logging/audit purposes.

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

## Phase 3: Company & Multi-Tenancy (Week 2)

### 3.1 Company Scoping in Base Model

**Tasks:**
- [ ] Create base model method to automatically filter by company_id
- [ ] Ensure all queries respect company isolation
- [ ] Add company_id to all insert operations automatically

**Implementation approach:**
- Override `beforeFind()` to add company_id filter
- Override `beforeInsert()` to add company_id from JWT token
- Store company_id in request during AuthFilter execution

**Files to modify:**
- All entity models (PersonModel, VehicleModel, etc.)

---

### 3.2 Company Filter Middleware

**Tasks:**
- [ ] Implement `CompanyFilter.php` to extract company_id from JWT
- [ ] Store company_id in request object or service for models to access
- [ ] Apply filter to all protected API routes
- [ ] Test company isolation with multiple companies

**Files to configure:**
- `app/Config/Filters.php` - Apply CompanyFilter after AuthFilter

---

### 3.3 Test Multi-Tenant Isolation

**Tasks:**
- [ ] Create two test companies
- [ ] Create resources in each company
- [ ] Verify users can only see their own company's data
- [ ] Test cross-company access attempts (should fail)

---

## Phase 4: People Management (Week 2-3)

### 4.1 Person Model & Entity

**Tasks:**
- [ ] Create `PersonModel.php` with:
  - CRUD operations
  - Company scoping
  - Soft delete support (`is_deleted` field)
  - Password hashing in beforeInsert/beforeUpdate
  - Query builder methods: `withDeleted()`, `onlyDeleted()`, `assignable()`
- [ ] Create `Person` entity with:
  - Attribute casting (dates, booleans)
  - Helper methods: `isAdmin()`, `isMember()`, `isAssignable()`, `isDeleted()`
  - Password hashing mutator
- [ ] Test person creation and retrieval

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
  - `POST /api/people` - Create new person (Admin only)
  - `PUT /api/people/:id` - Update person (Admin only)
  - `DELETE /api/people/:id` - Soft delete person (Admin only)
  - `POST /api/people/:id/restore` - Undelete person (Admin only)
- [ ] Add validation rules for person creation/update
- [ ] Protect admin endpoints with AdminFilter
- [ ] Test all endpoints with Postman

**Validation rules:**
- Name: required
- Email: required, valid email, unique within company
- Password: required on create, min 8 characters
- Role: required, in_list[admin,member]

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

## Phase 8: Conflict Detection (Week 5)

### 8.1 Conflict Detection Library

**Tasks:**
- [ ] Create `ConflictDetection.php` library
- [ ] Implement `findConflicts($bookingData)` method:
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
- `app/Database/Seeds/DatabaseSeeder.php`

**Commands:**
```bash
php spark db:seed DatabaseSeeder
```

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
php spark test
php spark test --coverage-html writable/coverage
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

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| 1 | Week 1 | Project setup, database, JWT foundation |
| 2 | Week 1-2 | Authentication system (register, login, logout) |
| 3 | Week 2 | Multi-tenancy & company isolation |
| 4 | Week 2-3 | People management (CRUD, soft delete, assignable filter) |
| 5 | Week 3 | Vehicle management (CRUD, soft delete) |
| 6 | Week 3 | Equipment management (CRUD, soft delete) |
| 7 | Week 4-5 | Booking management (CRUD, entity assignments, filters) |
| 8 | Week 5 | Conflict detection (time overlap checking) |
| 9 | Week 6 | Testing, seeders, polish, documentation |

**Total Estimated Time:** 6 weeks for backend MVP

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
- [ ] Passwords are hashed using `password_hash()`
- [ ] JWT tokens expire after configured time
- [ ] Protected routes require valid JWT token
- [ ] Company isolation prevents cross-tenant access
- [ ] Admin endpoints protected with AdminFilter
- [ ] SQL injection prevention (using query builder)
- [ ] XSS protection (input validation and escaping)

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

```json
{
  "require": {
    "php": "^8.1",
    "codeigniter4/framework": "^4.4",
    "firebase/php-jwt": "^6.0"
  },
  "require-dev": {
    "fakerphp/faker": "^1.9",
    "phpunit/phpunit": "^9.5"
  }
}
```

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
#--------------------------------------------------------------------
# ENVIRONMENT
#--------------------------------------------------------------------
CI_ENVIRONMENT = development

#--------------------------------------------------------------------
# APP
#--------------------------------------------------------------------
app.baseURL = 'http://localhost:8080/'
app.indexPage = ''
app.defaultLocale = 'en'

#--------------------------------------------------------------------
# DATABASE
#--------------------------------------------------------------------
database.default.hostname = localhost
database.default.database = schedulepro
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi
database.default.port = 3306

#--------------------------------------------------------------------
# JWT AUTHENTICATION
#--------------------------------------------------------------------
jwt.secret = YOUR_SECRET_KEY_HERE_GENERATE_WITH_openssl_rand_base64_32
jwt.expire = 86400
jwt.algorithm = HS256

#--------------------------------------------------------------------
# CORS
#--------------------------------------------------------------------
cors.allowedOrigins = http://localhost:5173
cors.allowedMethods = GET, POST, PUT, DELETE, OPTIONS
cors.allowedHeaders = Content-Type, Authorization
```

### Generate JWT Secret

```bash
openssl rand -base64 32
```

---

*Plan Version: 1.0*
*Created: January 2026*
*Based on: PRD-backend.md v3.0*
