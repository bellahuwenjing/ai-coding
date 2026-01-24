# PRD: Backend API
## SchedulePro - CodeIgniter 4 + MySQL Multi-Tenant API

---

## 1. Overview

### 1.1 Product Summary
RESTful API for a multi-tenant scheduling system that manages resources (people, vehicles, equipment) and their schedules.

### 1.2 Key Features
- Multi-tenant architecture (company isolation)
- Role-based access control (Admin, Member)
- Resource and schedule management
- Conflict detection
- JWT/Token authentication

---

## 2. Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | CodeIgniter 4.x |
| Database | MySQL 8 / MariaDB |
| Authentication | CodeIgniter Shield (or custom JWT with firebase/php-jwt) |
| Tasks | CodeIgniter Tasks |
| Cache | Redis (optional) or file |
| PHP Version | 8.1+ |

---

## 3. Project Structure

```
schpro-backend/
├── app/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   ├── LoginController.php
│   │   │   ├── RegisterController.php
│   │   │   └── LogoutController.php
│   │   ├── ResourceController.php
│   │   ├── ScheduleController.php
│   │   └── UserController.php
│   ├── Filters/
│   │   ├── AuthFilter.php
│   │   ├── AdminFilter.php
│   │   └── CompanyFilter.php
│   ├── Models/
│   │   ├── CompanyModel.php
│   │   ├── UserModel.php
│   │   ├── ResourceModel.php
│   │   └── ScheduleModel.php
│   ├── Libraries/
│   │   ├── ConflictDetection.php
│   │   └── ScheduleService.php
│   ├── Entities/
│   │   ├── Company.php
│   │   ├── User.php
│   │   ├── Resource.php
│   │   └── Schedule.php
│   ├── Database/
│   │   ├── Migrations/
│   │   └── Seeds/
│   └── Config/
│       ├── Routes.php
│       ├── Filters.php
│       └── Validation.php
├── writable/
│   ├── logs/
│   ├── cache/
│   └── session/
├── public/
│   └── index.php
├── tests/
├── .env
└── spark
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
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    UNIQUE INDEX idx_email (email),
    INDEX idx_company_id (company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### 4.3 auth_tokens (for JWT/token auth)

```sql
CREATE TABLE auth_tokens (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    UNIQUE INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.4 resources

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

### 4.5 schedules

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

### 4.6 Database Migrations (CI4 Format)

```php
<?php
// app/Database/Migrations/2026-01-01-000001_CreateCompaniesTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCompaniesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'slug' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'settings' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('slug');
        $this->forge->addKey('slug', false, false, 'idx_slug');
        $this->forge->createTable('companies');
    }

    public function down()
    {
        $this->forge->dropTable('companies');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000002_CreateUsersTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUsersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'company_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'email' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'password' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'role' => [
                'type' => 'ENUM',
                'constraint' => ['admin', 'member'],
                'default' => 'member',
            ],
            'email_verified_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('email', 'idx_email');
        $this->forge->addKey('company_id', false, false, 'idx_company_id');
        $this->forge->addForeignKey('company_id', 'companies', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('users');
    }

    public function down()
    {
        $this->forge->dropTable('users');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000003_CreateResourcesTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateResourcesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'company_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'type' => [
                'type' => 'ENUM',
                'constraint' => ['person', 'vehicle', 'equipment'],
            ],
            'metadata' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'availability' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'is_active' => [
                'type' => 'BOOLEAN',
                'default' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('company_id', false, false, 'idx_company_id');
        $this->forge->addKey('type', false, false, 'idx_type');
        $this->forge->addKey('is_active', false, false, 'idx_is_active');
        $this->forge->addForeignKey('company_id', 'companies', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('resources');
    }

    public function down()
    {
        $this->forge->dropTable('resources');
    }
}
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

### 6.1 Base Model with Company Scoping

```php
<?php
// app/Models/BaseModel.php
namespace App\Models;

use CodeIgniter\Model;

class BaseModel extends Model
{
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * Get records scoped to the current user's company
     */
    public function getByCompany(int $companyId)
    {
        return $this->where('company_id', $companyId)->findAll();
    }

    /**
     * Find a record ensuring it belongs to the company
     */
    public function findByCompany(int $id, int $companyId)
    {
        return $this->where('id', $id)
                    ->where('company_id', $companyId)
                    ->first();
    }

    /**
     * Automatically add company_id on insert
     */
    protected function setCompanyId(array $data)
    {
        if (!isset($data['data']['company_id'])) {
            $session = session();
            $user = $session->get('user');
            if ($user && isset($user['company_id'])) {
                $data['data']['company_id'] = $user['company_id'];
            }
        }
        return $data;
    }
}
```

### 6.2 Resource Model

```php
<?php
// app/Models/ResourceModel.php
namespace App\Models;

class ResourceModel extends BaseModel
{
    protected $table         = 'resources';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'company_id',
        'name',
        'type',
        'metadata',
        'availability',
        'is_active'
    ];

    protected $validationRules = [
        'name' => 'required|max_length[255]',
        'type' => 'required|in_list[person,vehicle,equipment]',
    ];

    protected $casts = [
        'metadata'     => 'json-array',
        'availability' => 'json-array',
        'is_active'    => 'boolean',
    ];

    protected $beforeInsert = ['setCompanyId'];

    /**
     * Get resources for a company with optional filters
     */
    public function getFiltered(int $companyId, array $filters = [])
    {
        $this->where('company_id', $companyId);

        if (!empty($filters['type'])) {
            $this->where('type', $filters['type']);
        }

        if (isset($filters['is_active'])) {
            $this->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['search'])) {
            $this->like('name', $filters['search']);
        }

        return $this;
    }

    /**
     * Get schedules for this resource
     */
    public function getSchedules(int $resourceId)
    {
        $scheduleModel = new ScheduleModel();
        return $scheduleModel->where('resource_id', $resourceId)->findAll();
    }
}
```

### 6.3 Schedule Model

```php
<?php
// app/Models/ScheduleModel.php
namespace App\Models;

class ScheduleModel extends BaseModel
{
    protected $table         = 'schedules';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'company_id',
        'resource_id',
        'created_by',
        'title',
        'start_time',
        'end_time',
        'notes',
        'recurrence_rule',
        'parent_schedule_id'
    ];

    protected $validationRules = [
        'resource_id' => 'required|integer',
        'title'       => 'required|max_length[255]',
        'start_time'  => 'required|valid_date',
        'end_time'    => 'required|valid_date',
    ];

    protected $beforeInsert = ['setCompanyId', 'setCreatedBy'];

    protected function setCreatedBy(array $data)
    {
        if (!isset($data['data']['created_by'])) {
            $session = session();
            $user = $session->get('user');
            if ($user && isset($user['id'])) {
                $data['data']['created_by'] = $user['id'];
            }
        }
        return $data;
    }

    /**
     * Get schedules within a date range
     */
    public function getByDateRange(int $companyId, string $startDate, string $endDate, array $filters = [])
    {
        $this->where('company_id', $companyId)
             ->where('start_time >=', $startDate)
             ->where('end_time <=', $endDate);

        if (!empty($filters['resource_id'])) {
            $this->where('resource_id', $filters['resource_id']);
        }

        return $this->findAll();
    }

    /**
     * Get schedule with resource details
     */
    public function getWithResource(int $id, int $companyId)
    {
        return $this->select('schedules.*, resources.name as resource_name, resources.type as resource_type')
                    ->join('resources', 'resources.id = schedules.resource_id')
                    ->where('schedules.id', $id)
                    ->where('schedules.company_id', $companyId)
                    ->first();
    }
}
```

### 6.4 Filters (Middleware equivalent)

```php
<?php
// app/Filters/AuthFilter.php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return service('response')
                ->setJSON(['message' => 'Unauthenticated'])
                ->setStatusCode(401);
        }

        $token = substr($authHeader, 7);

        try {
            $decoded = JWT::decode($token, new Key(getenv('JWT_SECRET'), 'HS256'));

            // Store user in session for access in controllers
            $session = session();
            $session->set('user', [
                'id'         => $decoded->sub,
                'company_id' => $decoded->company_id,
                'role'       => $decoded->role,
            ]);

        } catch (\Exception $e) {
            return service('response')
                ->setJSON(['message' => 'Invalid token'])
                ->setStatusCode(401);
        }

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response;
    }
}
```

```php
<?php
// app/Filters/AdminFilter.php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AdminFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $session = session();
        $user = $session->get('user');

        if (!$user || $user['role'] !== 'admin') {
            return service('response')
                ->setJSON(['message' => 'Forbidden. Admin access required.'])
                ->setStatusCode(403);
        }

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response;
    }
}
```

```php
<?php
// app/Filters/CompanyFilter.php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class CompanyFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $session = session();
        $user = $session->get('user');

        if (!$user || !isset($user['company_id'])) {
            return service('response')
                ->setJSON(['message' => 'Company context not available'])
                ->setStatusCode(401);
        }

        // Company context is now available via session
        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response;
    }
}
```

### 6.5 Filter Configuration

```php
<?php
// app/Config/Filters.php
namespace Config;

use CodeIgniter\Config\BaseConfig;

class Filters extends BaseConfig
{
    public array $aliases = [
        'auth'    => \App\Filters\AuthFilter::class,
        'admin'   => \App\Filters\AdminFilter::class,
        'company' => \App\Filters\CompanyFilter::class,
    ];

    public array $globals = [
        'before' => [],
        'after'  => [],
    ];

    public array $methods = [];

    public array $filters = [];
}
```

---

## 7. Routes Configuration

```php
<?php
// app/Config/Routes.php
use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// Public auth routes
$routes->group('api/auth', function ($routes) {
    $routes->post('register', 'Auth\RegisterController::register');
    $routes->post('login', 'Auth\LoginController::login');
});

// Protected routes
$routes->group('api', ['filter' => 'auth'], function ($routes) {

    // Auth routes (require authentication)
    $routes->post('auth/logout', 'Auth\LogoutController::logout');
    $routes->get('auth/me', 'Auth\LoginController::me');

    // Resources
    $routes->get('resources', 'ResourceController::index');
    $routes->get('resources/(:num)', 'ResourceController::show/$1');
    $routes->post('resources', 'ResourceController::create', ['filter' => 'admin']);
    $routes->put('resources/(:num)', 'ResourceController::update/$1', ['filter' => 'admin']);
    $routes->delete('resources/(:num)', 'ResourceController::delete/$1', ['filter' => 'admin']);

    // Schedules
    $routes->get('schedules', 'ScheduleController::index');
    $routes->get('schedules/conflicts', 'ScheduleController::conflicts');
    $routes->get('schedules/(:num)', 'ScheduleController::show/$1');
    $routes->post('schedules', 'ScheduleController::create', ['filter' => 'admin']);
    $routes->put('schedules/(:num)', 'ScheduleController::update/$1', ['filter' => 'admin']);
    $routes->delete('schedules/(:num)', 'ScheduleController::delete/$1', ['filter' => 'admin']);

    // Users (Admin only)
    $routes->group('users', ['filter' => 'admin'], function ($routes) {
        $routes->get('/', 'UserController::index');
        $routes->post('/', 'UserController::create');
        $routes->get('(:num)', 'UserController::show/$1');
        $routes->put('(:num)', 'UserController::update/$1');
        $routes->delete('(:num)', 'UserController::delete/$1');
    });
});
```

---

## 8. Business Logic

### 8.1 Conflict Detection Library

```php
<?php
// app/Libraries/ConflictDetection.php
namespace App\Libraries;

use App\Models\ScheduleModel;
use CodeIgniter\I18n\Time;

class ConflictDetection
{
    protected ScheduleModel $scheduleModel;

    public function __construct()
    {
        $this->scheduleModel = new ScheduleModel();
    }

    /**
     * Find conflicting schedules for a resource
     */
    public function findConflicts(
        int $resourceId,
        string $startTime,
        string $endTime,
        ?int $excludeScheduleId = null
    ): array {
        $builder = $this->scheduleModel->builder();

        $builder->where('resource_id', $resourceId)
                ->where('start_time <', $endTime)
                ->where('end_time >', $startTime);

        if ($excludeScheduleId) {
            $builder->where('id !=', $excludeScheduleId);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Check if there are any conflicts
     */
    public function hasConflicts(
        int $resourceId,
        string $startTime,
        string $endTime,
        ?int $excludeScheduleId = null
    ): bool {
        return count($this->findConflicts($resourceId, $startTime, $endTime, $excludeScheduleId)) > 0;
    }
}
```

### 8.2 Schedule Service

```php
<?php
// app/Libraries/ScheduleService.php
namespace App\Libraries;

use App\Models\ScheduleModel;
use CodeIgniter\I18n\Time;

class ScheduleService
{
    protected ScheduleModel $scheduleModel;
    protected ConflictDetection $conflictDetection;

    public function __construct()
    {
        $this->scheduleModel = new ScheduleModel();
        $this->conflictDetection = new ConflictDetection();
    }

    /**
     * Create a new schedule with conflict checking
     */
    public function createSchedule(array $data): array
    {
        // Check for conflicts
        if ($this->conflictDetection->hasConflicts(
            $data['resource_id'],
            $data['start_time'],
            $data['end_time']
        )) {
            throw new \RuntimeException('Schedule conflicts with existing schedules');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        $scheduleId = $this->scheduleModel->insert($data);

        // Handle recurring schedules
        if (!empty($data['recurrence_rule'])) {
            $this->createRecurringInstances($scheduleId, $data);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new \RuntimeException('Failed to create schedule');
        }

        return $this->scheduleModel->find($scheduleId);
    }

    /**
     * Create recurring schedule instances
     */
    private function createRecurringInstances(int $parentId, array $data): void
    {
        $rule = $data['recurrence_rule'];
        $start = Time::parse($data['start_time']);
        $end = Time::parse($data['end_time']);
        $duration = $start->difference($end)->getMinutes();

        $instances = [];
        $limit = Time::now()->addMonths(3);

        while ($start->isBefore($limit)) {
            $start = match ($rule) {
                'daily'   => $start->addDays(1),
                'weekly'  => $start->addDays(7),
                'monthly' => $start->addMonths(1),
                default   => $limit,
            };

            if ($start->isBefore($limit)) {
                $instanceEnd = $start->addMinutes($duration);

                $instances[] = [
                    'company_id'         => $data['company_id'],
                    'resource_id'        => $data['resource_id'],
                    'created_by'         => $data['created_by'],
                    'title'              => $data['title'],
                    'start_time'         => $start->toDateTimeString(),
                    'end_time'           => $instanceEnd->toDateTimeString(),
                    'notes'              => $data['notes'] ?? null,
                    'parent_schedule_id' => $parentId,
                    'created_at'         => Time::now()->toDateTimeString(),
                    'updated_at'         => Time::now()->toDateTimeString(),
                ];
            }
        }

        if (!empty($instances)) {
            $this->scheduleModel->insertBatch($instances);
        }
    }

    /**
     * Update a schedule
     */
    public function updateSchedule(int $id, array $data): array
    {
        // Check for conflicts (exclude self)
        if (isset($data['start_time']) && isset($data['end_time'])) {
            if ($this->conflictDetection->hasConflicts(
                $data['resource_id'],
                $data['start_time'],
                $data['end_time'],
                $id
            )) {
                throw new \RuntimeException('Schedule conflicts with existing schedules');
            }
        }

        $this->scheduleModel->update($id, $data);
        return $this->scheduleModel->find($id);
    }
}
```

---

## 9. Validation

### 9.1 Custom Validation Configuration

```php
<?php
// app/Config/Validation.php
namespace Config;

use CodeIgniter\Config\BaseConfig;
use CodeIgniter\Validation\StrictRules\CreditCardRules;
use CodeIgniter\Validation\StrictRules\FileRules;
use CodeIgniter\Validation\StrictRules\FormatRules;
use CodeIgniter\Validation\StrictRules\Rules;

class Validation extends BaseConfig
{
    public array $ruleSets = [
        Rules::class,
        FormatRules::class,
        FileRules::class,
        CreditCardRules::class,
    ];

    // Resource validation rules
    public array $resource = [
        'name' => 'required|max_length[255]',
        'type' => 'required|in_list[person,vehicle,equipment]',
        'is_active' => 'permit_empty|in_list[0,1,true,false]',
    ];

    public array $resource_errors = [
        'name' => [
            'required' => 'Resource name is required.',
            'max_length' => 'Resource name cannot exceed 255 characters.',
        ],
        'type' => [
            'required' => 'Resource type is required.',
            'in_list' => 'Type must be person, vehicle, or equipment.',
        ],
    ];

    // Schedule validation rules
    public array $schedule = [
        'resource_id' => 'required|integer',
        'title' => 'required|max_length[255]',
        'start_time' => 'required|valid_date',
        'end_time' => 'required|valid_date',
        'recurrence_rule' => 'permit_empty|in_list[daily,weekly,monthly]',
    ];

    public array $schedule_errors = [
        'resource_id' => [
            'required' => 'Resource is required.',
            'integer' => 'Invalid resource ID.',
        ],
        'title' => [
            'required' => 'Title is required.',
            'max_length' => 'Title cannot exceed 255 characters.',
        ],
        'end_time' => [
            'valid_date' => 'End time must be a valid date.',
        ],
    ];

    // User validation rules
    public array $user = [
        'name' => 'required|max_length[255]',
        'email' => 'required|valid_email|max_length[255]',
        'password' => 'required|min_length[8]',
        'role' => 'permit_empty|in_list[admin,member]',
    ];

    // Login validation
    public array $login = [
        'email' => 'required|valid_email',
        'password' => 'required',
    ];

    // Registration validation
    public array $register = [
        'company_name' => 'required|max_length[255]',
        'name' => 'required|max_length[255]',
        'email' => 'required|valid_email|is_unique[users.email]',
        'password' => 'required|min_length[8]',
        'password_confirmation' => 'required|matches[password]',
    ];
}
```

### 9.2 Controller Validation Example

```php
<?php
// app/Controllers/ResourceController.php
namespace App\Controllers;

use App\Models\ResourceModel;
use CodeIgniter\RESTful\ResourceController as BaseResourceController;

class ResourceController extends BaseResourceController
{
    protected ResourceModel $resourceModel;

    public function __construct()
    {
        $this->resourceModel = new ResourceModel();
    }

    public function index()
    {
        $session = session();
        $user = $session->get('user');

        $filters = [
            'type'      => $this->request->getGet('type'),
            'is_active' => $this->request->getGet('is_active'),
            'search'    => $this->request->getGet('search'),
        ];

        $perPage = (int) ($this->request->getGet('per_page') ?? 25);

        $resources = $this->resourceModel
            ->getFiltered($user['company_id'], $filters)
            ->paginate($perPage);

        $pager = $this->resourceModel->pager;

        return $this->respond([
            'data' => $resources,
            'meta' => [
                'current_page' => $pager->getCurrentPage(),
                'per_page'     => $perPage,
                'total'        => $pager->getTotal(),
                'last_page'    => $pager->getPageCount(),
            ],
        ]);
    }

    public function create()
    {
        $validation = \Config\Services::validation();

        if (!$this->validate('resource')) {
            return $this->failValidation($validation->getErrors());
        }

        $session = session();
        $user = $session->get('user');

        $data = [
            'company_id'   => $user['company_id'],
            'name'         => $this->request->getPost('name'),
            'type'         => $this->request->getPost('type'),
            'metadata'     => $this->request->getPost('metadata'),
            'availability' => $this->request->getPost('availability'),
            'is_active'    => $this->request->getPost('is_active') ?? true,
        ];

        $id = $this->resourceModel->insert($data);

        if (!$id) {
            return $this->failServerError('Failed to create resource');
        }

        $resource = $this->resourceModel->find($id);

        return $this->respondCreated([
            'data' => $resource,
        ]);
    }

    public function show($id = null)
    {
        $session = session();
        $user = $session->get('user');

        $resource = $this->resourceModel->findByCompany($id, $user['company_id']);

        if (!$resource) {
            return $this->failNotFound('Resource not found');
        }

        return $this->respond([
            'data' => $resource,
        ]);
    }

    public function update($id = null)
    {
        $session = session();
        $user = $session->get('user');

        $resource = $this->resourceModel->findByCompany($id, $user['company_id']);

        if (!$resource) {
            return $this->failNotFound('Resource not found');
        }

        $data = $this->request->getJSON(true);

        if (!$this->resourceModel->update($id, $data)) {
            return $this->failValidation($this->resourceModel->errors());
        }

        return $this->respond([
            'data' => $this->resourceModel->find($id),
        ]);
    }

    public function delete($id = null)
    {
        $session = session();
        $user = $session->get('user');

        $resource = $this->resourceModel->findByCompany($id, $user['company_id']);

        if (!$resource) {
            return $this->failNotFound('Resource not found');
        }

        $this->resourceModel->delete($id);

        return $this->respondNoContent();
    }
}
```

---

## 10. Error Responses

### 10.1 Standard Error Format

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

### 10.2 HTTP Status Codes

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

## 11. Security

### 11.1 Authentication
- All endpoints except `/auth/register` and `/auth/login` require Bearer token (JWT)
- Tokens expire after 24 hours (configurable)
- Tokens can be revoked via logout

### 11.2 Authorization
- Admin role required for create/update/delete operations
- Member role can only read resources and schedules
- All queries scoped to user's company via Filters and Model methods

### 11.3 Data Protection
- Passwords hashed with `password_hash()` (bcrypt)
- SQL injection prevented via Query Builder and prepared statements
- XSS prevented via JSON-only API responses
- Rate limiting available via CodeIgniter Throttler

---

## 12. Environment Variables

```env
# .env
CI_ENVIRONMENT = production

app.baseURL = 'https://api.schedulepro.com/'

database.default.hostname = localhost
database.default.database = schedulepro
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi
database.default.port = 3306

JWT_SECRET = your-256-bit-secret-key-here
JWT_EXPIRATION = 86400

session.driver = CodeIgniter\Session\Handlers\FileHandler
session.cookieName = ci_session
session.savePath = WRITEPATH/session
```

---

## 13. Deployment

### 13.1 Requirements
- PHP 8.1+
- MySQL 8.0+ or MariaDB 10.6+
- Composer
- Writable directories: `writable/`

### 13.2 Installation Steps
```bash
# Install dependencies
composer install --no-dev --optimize-autoloader

# Set environment
cp env .env
# Edit .env with production settings

# Run migrations
php spark migrate

# Clear and rebuild caches
php spark cache:clear

# Ensure writable permissions
chmod -R 755 writable/
```

### 13.3 Spark CLI Commands
```bash
# Run development server
php spark serve

# Run migrations
php spark migrate
php spark migrate:rollback
php spark migrate:status

# Database seeding
php spark db:seed DatabaseSeeder

# Create new migration
php spark make:migration CreateTableName

# Create new controller
php spark make:controller ControllerName

# Create new model
php spark make:model ModelName

# View routes
php spark routes
```

### 13.4 Hosting Options
- Traditional VPS with Apache/Nginx + PHP-FPM
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Shared hosting (with PHP 8.1+ support)

---

## 14. Testing

### 14.1 Test Coverage Required
- Authentication flow (register, login, logout)
- CRUD operations for resources
- CRUD operations for schedules
- Conflict detection logic
- Multi-tenant isolation
- Role-based access control

### 14.2 Example Test

```php
<?php
// tests/Feature/ScheduleConflictTest.php
namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Test\DatabaseTestTrait;
use App\Models\UserModel;
use App\Models\ResourceModel;
use App\Models\ScheduleModel;

class ScheduleConflictTest extends CIUnitTestCase
{
    use FeatureTestTrait;
    use DatabaseTestTrait;

    protected $refresh = true;

    public function testPreventsOverlappingSchedules(): void
    {
        // Create test data
        $userModel = new UserModel();
        $resourceModel = new ResourceModel();
        $scheduleModel = new ScheduleModel();

        $companyId = 1; // Assuming seeded company

        $userId = $userModel->insert([
            'company_id' => $companyId,
            'email' => 'admin@test.com',
            'password' => password_hash('password', PASSWORD_DEFAULT),
            'name' => 'Test Admin',
            'role' => 'admin',
        ]);

        $resourceId = $resourceModel->insert([
            'company_id' => $companyId,
            'name' => 'Test Resource',
            'type' => 'person',
        ]);

        // Create first schedule
        $scheduleModel->insert([
            'company_id' => $companyId,
            'resource_id' => $resourceId,
            'created_by' => $userId,
            'title' => 'Existing Schedule',
            'start_time' => '2026-01-25 10:00:00',
            'end_time' => '2026-01-25 12:00:00',
        ]);

        // Generate JWT token for auth
        $token = $this->generateTestToken($userId, $companyId, 'admin');

        // Attempt overlapping schedule
        $result = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/schedules', [
            'resource_id' => $resourceId,
            'title' => 'Overlapping Schedule',
            'start_time' => '2026-01-25 11:00:00',
            'end_time' => '2026-01-25 13:00:00',
        ]);

        $result->assertStatus(422);
    }

    private function generateTestToken(int $userId, int $companyId, string $role): string
    {
        // Generate test JWT token
        $payload = [
            'sub' => $userId,
            'company_id' => $companyId,
            'role' => $role,
            'exp' => time() + 3600,
        ];

        return \Firebase\JWT\JWT::encode($payload, getenv('JWT_SECRET'), 'HS256');
    }
}
```

### 14.3 Running Tests

```bash
# Run all tests
php spark test

# Run specific test file
php spark test tests/Feature/ScheduleConflictTest.php

# Run with coverage
php spark test --coverage-html writable/coverage
```

---

*Document Version: 2.0*
*Framework: CodeIgniter 4*
*Last Updated: January 2026*
