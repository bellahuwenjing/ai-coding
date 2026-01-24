# PRD: Backend API
## SchedulePro - Laravel + MySQL Multi-Tenant API

---

## 1. Overview

### 1.1 Product Summary
RESTful API for a multi-tenant scheduling system that manages resources (people, vehicles, equipment) and their schedules.

### 1.2 Key Features
- Multi-tenant architecture (company isolation)
- Role-based access control (Admin, Member)
- Resource and schedule management
- Conflict detection
- API token authentication

---

## 2. Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | Laravel 11 |
| Database | MySQL 8 / MariaDB |
| Authentication | Laravel Sanctum (API tokens) |
| Queue | Laravel Queue (database driver) |
| Cache | Redis (optional) or file |
| PHP Version | 8.2+ |

---

## 3. Project Structure

```
schpro-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginController.php
│   │   │   │   ├── RegisterController.php
│   │   │   │   └── LogoutController.php
│   │   │   ├── ResourceController.php
│   │   │   ├── ScheduleController.php
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureUserIsAdmin.php
│   │   │   └── SetCompanyScope.php
│   │   └── Requests/
│   │       ├── StoreResourceRequest.php
│   │       ├── UpdateResourceRequest.php
│   │       ├── StoreScheduleRequest.php
│   │       └── UpdateScheduleRequest.php
│   ├── Models/
│   │   ├── Company.php
│   │   ├── User.php
│   │   ├── Resource.php
│   │   └── Schedule.php
│   ├── Policies/
│   │   ├── ResourcePolicy.php
│   │   └── SchedulePolicy.php
│   ├── Services/
│   │   ├── ConflictDetectionService.php
│   │   └── ScheduleService.php
│   └── Scopes/
│       └── CompanyScope.php
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
├── config/
├── tests/
└── .env.example
```

---

## 4. Database Schema

### 4.1 companies

```sql
CREATE TABLE companies (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSON DEFAULT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    INDEX idx_slug (slug)
);
```

**Settings JSON Structure:**
```json
{
    "timezone": "America/New_York",
    "allow_conflicts": false,
    "default_schedule_duration": 60,
    "working_hours": {
        "start": "09:00",
        "end": "17:00"
    }
}
```

### 4.2 users

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    UNIQUE INDEX idx_email (email),
    INDEX idx_company_id (company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### 4.3 resources

```sql
CREATE TABLE resources (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('person', 'vehicle', 'equipment') NOT NULL,
    metadata JSON DEFAULT NULL,
    availability JSON DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    INDEX idx_company_id (company_id),
    INDEX idx_type (type),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

**Metadata JSON Structure (by type):**

Person:
```json
{
    "email": "john@example.com",
    "phone": "+1234567890",
    "skills": ["welding", "electrical"],
    "certifications": ["OSHA", "First Aid"],
    "hourly_rate": 25.00
}
```

Vehicle:
```json
{
    "make": "Ford",
    "model": "F-150",
    "year": 2022,
    "license_plate": "ABC-1234",
    "capacity": "1500 lbs",
    "vin": "1FTFW1E85MFA12345"
}
```

Equipment:
```json
{
    "serial_number": "EQ-12345",
    "manufacturer": "CAT",
    "model": "320 Excavator",
    "condition": "good",
    "last_maintenance": "2025-12-01"
}
```

**Availability JSON Structure:**
```json
{
    "monday": { "start": "09:00", "end": "17:00" },
    "tuesday": { "start": "09:00", "end": "17:00" },
    "wednesday": { "start": "09:00", "end": "17:00" },
    "thursday": { "start": "09:00", "end": "17:00" },
    "friday": { "start": "09:00", "end": "17:00" },
    "saturday": null,
    "sunday": null,
    "exceptions": [
        { "date": "2026-01-01", "available": false, "reason": "Holiday" }
    ]
}
```

### 4.4 schedules

```sql
CREATE TABLE schedules (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    notes TEXT NULL,
    recurrence_rule VARCHAR(255) NULL,
    parent_schedule_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    INDEX idx_company_id (company_id),
    INDEX idx_resource_id (resource_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_time_range (resource_id, start_time, end_time),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);
```

### 4.5 personal_access_tokens (Sanctum)

```sql
-- Laravel Sanctum default table
CREATE TABLE personal_access_tokens (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    UNIQUE INDEX idx_token (token),
    INDEX idx_tokenable (tokenable_type, tokenable_id)
);
```

---

## 5. API Endpoints

### 5.1 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new company + admin user | No |
| POST | `/api/auth/login` | Login, returns API token | No |
| POST | `/api/auth/logout` | Revoke current token | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |

**POST /api/auth/register**

Request:
```json
{
    "company_name": "Acme Corp",
    "name": "John Doe",
    "email": "john@acme.com",
    "password": "securepassword123",
    "password_confirmation": "securepassword123"
}
```

Response (201):
```json
{
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@acme.com",
        "role": "admin",
        "company_id": 1
    },
    "company": {
        "id": 1,
        "name": "Acme Corp",
        "slug": "acme-corp"
    },
    "token": "1|abc123..."
}
```

**POST /api/auth/login**

Request:
```json
{
    "email": "john@acme.com",
    "password": "securepassword123"
}
```

Response (200):
```json
{
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@acme.com",
        "role": "admin",
        "company_id": 1
    },
    "token": "2|xyz789..."
}
```

---

### 5.2 Resources

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/resources` | List all resources | All |
| POST | `/api/resources` | Create resource | Admin |
| GET | `/api/resources/{id}` | Get resource details | All |
| PUT | `/api/resources/{id}` | Update resource | Admin |
| DELETE | `/api/resources/{id}` | Delete resource | Admin |

**GET /api/resources**

Query Parameters:
- `type` (string): Filter by type (person, vehicle, equipment)
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name
- `per_page` (integer): Items per page (default: 25)
- `page` (integer): Page number

Response (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "John Smith",
            "type": "person",
            "is_active": true,
            "metadata": {
                "email": "john.smith@acme.com",
                "skills": ["electrical", "plumbing"]
            },
            "availability": { ... },
            "created_at": "2026-01-15T10:00:00Z",
            "updated_at": "2026-01-15T10:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 25,
        "total": 42,
        "last_page": 2
    }
}
```

**POST /api/resources**

Request:
```json
{
    "name": "Ford F-150 #3",
    "type": "vehicle",
    "metadata": {
        "make": "Ford",
        "model": "F-150",
        "license_plate": "XYZ-789"
    },
    "availability": {
        "monday": { "start": "06:00", "end": "18:00" },
        "tuesday": { "start": "06:00", "end": "18:00" }
    }
}
```

Response (201):
```json
{
    "data": {
        "id": 5,
        "name": "Ford F-150 #3",
        "type": "vehicle",
        "is_active": true,
        "metadata": { ... },
        "availability": { ... },
        "created_at": "2026-01-22T14:30:00Z",
        "updated_at": "2026-01-22T14:30:00Z"
    }
}
```

---

### 5.3 Schedules

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/schedules` | List schedules | All |
| POST | `/api/schedules` | Create schedule | Admin |
| GET | `/api/schedules/{id}` | Get schedule details | All |
| PUT | `/api/schedules/{id}` | Update schedule | Admin |
| DELETE | `/api/schedules/{id}` | Delete schedule | Admin |
| GET | `/api/schedules/conflicts` | Check for conflicts | All |

**GET /api/schedules**

Query Parameters:
- `resource_id` (integer): Filter by resource
- `resource_type` (string): Filter by resource type
- `start_date` (date): Start of date range (required)
- `end_date` (date): End of date range (required)
- `per_page` (integer): Items per page

Response (200):
```json
{
    "data": [
        {
            "id": 1,
            "resource_id": 3,
            "resource": {
                "id": 3,
                "name": "John Smith",
                "type": "person"
            },
            "title": "Site Visit - 123 Main St",
            "start_time": "2026-01-22T09:00:00Z",
            "end_time": "2026-01-22T12:00:00Z",
            "notes": "Bring electrical tools",
            "recurrence_rule": null,
            "created_by": {
                "id": 1,
                "name": "Jane Admin"
            },
            "created_at": "2026-01-20T08:00:00Z",
            "updated_at": "2026-01-20T08:00:00Z"
        }
    ],
    "meta": { ... }
}
```

**POST /api/schedules**

Request:
```json
{
    "resource_id": 3,
    "title": "Equipment Maintenance",
    "start_time": "2026-01-25T10:00:00",
    "end_time": "2026-01-25T14:00:00",
    "notes": "Quarterly maintenance check",
    "recurrence_rule": "weekly"
}
```

Response (201):
```json
{
    "data": {
        "id": 15,
        "resource_id": 3,
        "title": "Equipment Maintenance",
        "start_time": "2026-01-25T10:00:00Z",
        "end_time": "2026-01-25T14:00:00Z",
        "notes": "Quarterly maintenance check",
        "recurrence_rule": "weekly",
        "created_at": "2026-01-22T14:45:00Z",
        "updated_at": "2026-01-22T14:45:00Z"
    }
}
```

**GET /api/schedules/conflicts**

Query Parameters:
- `resource_id` (integer, required): Resource to check
- `start_time` (datetime, required): Proposed start
- `end_time` (datetime, required): Proposed end
- `exclude_id` (integer): Schedule ID to exclude (for updates)

Response (200):
```json
{
    "has_conflicts": true,
    "conflicts": [
        {
            "id": 12,
            "title": "Existing Appointment",
            "start_time": "2026-01-25T11:00:00Z",
            "end_time": "2026-01-25T13:00:00Z"
        }
    ]
}
```

---

### 5.4 Users (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List company users |
| POST | `/api/users` | Invite/create user |
| GET | `/api/users/{id}` | Get user details |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Remove user |

**POST /api/users**

Request:
```json
{
    "name": "New Member",
    "email": "newmember@acme.com",
    "role": "member",
    "password": "temporarypassword"
}
```

Response (201):
```json
{
    "data": {
        "id": 5,
        "name": "New Member",
        "email": "newmember@acme.com",
        "role": "member",
        "created_at": "2026-01-22T15:00:00Z"
    }
}
```

---

## 6. Multi-Tenancy Implementation

### 6.1 Company Scope

```php
// app/Scopes/CompanyScope.php
namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class CompanyScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check()) {
            $builder->where('company_id', auth()->user()->company_id);
        }
    }
}
```

### 6.2 Apply to Models

```php
// app/Models/Resource.php
namespace App\Models;

use App\Scopes\CompanyScope;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = [
        'company_id', 'name', 'type', 'metadata', 'availability', 'is_active'
    ];

    protected $casts = [
        'metadata' => 'array',
        'availability' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new CompanyScope);

        static::creating(function ($model) {
            if (auth()->check() && !$model->company_id) {
                $model->company_id = auth()->user()->company_id;
            }
        });
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
```

### 6.3 Middleware

```php
// app/Http/Middleware/SetCompanyScope.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetCompanyScope
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Company context is automatically applied via global scopes
        return $next($request);
    }
}
```

---

## 7. Business Logic

### 7.1 Conflict Detection Service

```php
// app/Services/ConflictDetectionService.php
namespace App\Services;

use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ConflictDetectionService
{
    public function findConflicts(
        int $resourceId,
        Carbon $start,
        Carbon $end,
        ?int $excludeScheduleId = null
    ): Collection {
        $query = Schedule::where('resource_id', $resourceId)
            ->where(function ($q) use ($start, $end) {
                // Overlap detection: schedules that start before new end AND end after new start
                $q->where('start_time', '<', $end)
                  ->where('end_time', '>', $start);
            });

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        return $query->get();
    }

    public function hasConflicts(
        int $resourceId,
        Carbon $start,
        Carbon $end,
        ?int $excludeScheduleId = null
    ): bool {
        return $this->findConflicts($resourceId, $start, $end, $excludeScheduleId)->isNotEmpty();
    }
}
```

### 7.2 Schedule Service

```php
// app/Services/ScheduleService.php
namespace App\Services;

use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ScheduleService
{
    public function __construct(
        private ConflictDetectionService $conflictService
    ) {}

    public function createSchedule(array $data): Schedule
    {
        $start = Carbon::parse($data['start_time']);
        $end = Carbon::parse($data['end_time']);

        // Check for conflicts
        if ($this->conflictService->hasConflicts($data['resource_id'], $start, $end)) {
            throw new \Exception('Schedule conflicts with existing schedules');
        }

        return DB::transaction(function () use ($data) {
            $schedule = Schedule::create([
                'resource_id' => $data['resource_id'],
                'title' => $data['title'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'notes' => $data['notes'] ?? null,
                'recurrence_rule' => $data['recurrence_rule'] ?? null,
                'created_by' => auth()->id(),
            ]);

            // Handle recurring schedules
            if (!empty($data['recurrence_rule'])) {
                $this->createRecurringInstances($schedule);
            }

            return $schedule;
        });
    }

    private function createRecurringInstances(Schedule $parent): void
    {
        // Generate instances for next 3 months based on recurrence rule
        $rule = $parent->recurrence_rule;
        $start = Carbon::parse($parent->start_time);
        $end = Carbon::parse($parent->end_time);
        $duration = $start->diffInMinutes($end);

        $instances = [];
        $limit = Carbon::now()->addMonths(3);

        while ($start->lt($limit)) {
            $start = match ($rule) {
                'daily' => $start->addDay(),
                'weekly' => $start->addWeek(),
                'monthly' => $start->addMonth(),
                default => $limit, // Exit loop for unknown rules
            };

            if ($start->lt($limit)) {
                $instances[] = [
                    'company_id' => $parent->company_id,
                    'resource_id' => $parent->resource_id,
                    'created_by' => $parent->created_by,
                    'title' => $parent->title,
                    'start_time' => $start->toDateTimeString(),
                    'end_time' => $start->copy()->addMinutes($duration)->toDateTimeString(),
                    'notes' => $parent->notes,
                    'parent_schedule_id' => $parent->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($instances)) {
            Schedule::insert($instances);
        }
    }
}
```

---

## 8. Validation Rules

### 8.1 Store Resource Request

```php
// app/Http/Requests/StoreResourceRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['person', 'vehicle', 'equipment'])],
            'metadata' => ['nullable', 'array'],
            'availability' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ];
    }
}
```

### 8.2 Store Schedule Request

```php
// app/Http/Requests/StoreScheduleRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'resource_id' => [
                'required',
                'integer',
                Rule::exists('resources', 'id')->where('company_id', $this->user()->company_id),
            ],
            'title' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date', 'after_or_equal:now'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'recurrence_rule' => ['nullable', Rule::in(['daily', 'weekly', 'monthly'])],
        ];
    }

    public function messages(): array
    {
        return [
            'end_time.after' => 'End time must be after start time.',
            'resource_id.exists' => 'The selected resource does not exist.',
        ];
    }
}
```

---

## 9. Error Responses

### 9.1 Standard Error Format

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

### 9.2 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request |
| 401 | Unauthenticated |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## 10. Security

### 10.1 Authentication
- All endpoints except `/auth/register` and `/auth/login` require Bearer token
- Tokens expire after 24 hours (configurable)
- Tokens can be revoked via logout

### 10.2 Authorization
- Admin role required for create/update/delete operations
- Member role can only read resources and schedules
- All queries scoped to user's company automatically

### 10.3 Data Protection
- Passwords hashed with bcrypt
- SQL injection prevented via Eloquent ORM
- XSS prevented via JSON-only API responses
- Rate limiting on authentication endpoints

---

## 11. Environment Variables

```env
# .env.example
APP_NAME=SchedulePro
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=schedulepro
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_TOKEN_EXPIRATION=1440

QUEUE_CONNECTION=database

CACHE_DRIVER=file
SESSION_DRIVER=file
```

---

## 12. Deployment

### 12.1 Requirements
- PHP 8.2+
- MySQL 8.0+ or MariaDB 10.6+
- Composer
- Node.js (for asset compilation if needed)

### 12.2 Installation Steps
```bash
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 12.3 Hosting Options
- Laravel Forge + DigitalOcean/AWS
- Laravel Vapor (serverless)
- Traditional VPS with Nginx + PHP-FPM

---

## 13. Testing

### 13.1 Test Coverage Required
- Authentication flow (register, login, logout)
- CRUD operations for resources
- CRUD operations for schedules
- Conflict detection logic
- Multi-tenant isolation
- Role-based access control

### 13.2 Example Test

```php
// tests/Feature/ScheduleConflictTest.php
public function test_prevents_overlapping_schedules(): void
{
    $user = User::factory()->admin()->create();
    $resource = Resource::factory()->create(['company_id' => $user->company_id]);

    // Create first schedule
    Schedule::factory()->create([
        'company_id' => $user->company_id,
        'resource_id' => $resource->id,
        'start_time' => '2026-01-25 10:00:00',
        'end_time' => '2026-01-25 12:00:00',
    ]);

    // Attempt overlapping schedule
    $response = $this->actingAs($user)->postJson('/api/schedules', [
        'resource_id' => $resource->id,
        'title' => 'Overlapping Schedule',
        'start_time' => '2026-01-25 11:00:00',
        'end_time' => '2026-01-25 13:00:00',
    ]);

    $response->assertStatus(422);
}
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
