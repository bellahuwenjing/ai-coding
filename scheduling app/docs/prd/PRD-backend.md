# PRD: Backend API
## SchedulePro - CodeIgniter 4 + MySQL Multi-Tenant API

---

## 1. Overview

### 1.1 Product Summary
RESTful API for a multi-tenant booking system that manages resources (people, vehicles, equipment) and allocates them to bookings.

### 1.2 Key Features
- Multi-tenant architecture (company isolation)
- Role-based access control (Admin, Member)
- Separate entity management for People, Vehicles, and Equipment
- Booking management with multi-entity assignment
- Basic conflict detection
- Soft delete with undelete functionality
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
│   │   ├── PersonController.php
│   │   ├── VehicleController.php
│   │   ├── EquipmentController.php
│   │   ├── BookingController.php
│   │   └── UserController.php
│   ├── Filters/
│   │   ├── AuthFilter.php
│   │   ├── AdminFilter.php
│   │   └── CompanyFilter.php
│   ├── Models/
│   │   ├── CompanyModel.php
│   │   ├── PersonModel.php
│   │   ├── VehicleModel.php
│   │   ├── EquipmentModel.php
│   │   ├── BookingModel.php
│   │   ├── BookingPersonModel.php
│   │   ├── BookingVehicleModel.php
│   │   └── BookingEquipmentModel.php
│   ├── Libraries/
│   │   ├── ConflictDetection.php
│   │   └── BookingService.php
│   ├── Entities/
│   │   ├── Company.php
│   │   ├── User.php
│   │   ├── Person.php
│   │   ├── Vehicle.php
│   │   ├── Equipment.php
│   │   └── Booking.php
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
    "default_booking_duration": 60,
    "working_hours": {
        "start": "09:00",
        "end": "17:00"
    }
}
```

### 4.2 auth_tokens (for JWT/token auth)

```sql
CREATE TABLE auth_tokens (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    person_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    UNIQUE INDEX idx_token (token),
    INDEX idx_person_id (person_id),
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);
```

### 4.3 people (Unified Authentication & Resource Table)

**Purpose**: Unified table serving both authentication (login) and resource scheduling (job assignment). All people can log in; members are assignable to bookings, admins are hidden from resource panels.

```sql
CREATE TABLE people (
    -- Primary identification
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,

    -- Core identity (required for all)
    name VARCHAR(255) NOT NULL,

    -- Authentication fields (required - everyone can log in)
    email VARCHAR(255) NOT NULL,            -- Required for login
    password VARCHAR(255) NOT NULL,         -- Required for authentication

    -- Role & Access Control
    role ENUM('admin', 'member') DEFAULT 'member',

    -- Resource scheduling fields
    phone VARCHAR(50) NULL,
    skills JSON NULL,                       -- ["electrical", "plumbing"]
    certifications JSON NULL,               -- ["OSHA", "First Aid"]
    hourly_rate DECIMAL(10,2) NULL,

    -- Soft delete
    is_deleted TINYINT(1) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    -- Indexes
    UNIQUE INDEX idx_email (email),
    INDEX idx_company_id (company_id),
    INDEX idx_role (role),
    INDEX idx_is_deleted (is_deleted),

    -- Foreign keys
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

**Key Design Decisions:**

- **Email REQUIRED**: All people must have email for login access
- **Password REQUIRED**: All people can authenticate
- **Two-tier role system**:
  - `admin`: Full system access, **HIDDEN from resource assignment panels**
  - `member`: Can log in, view bookings, **CAN be assigned to jobs**
- **No email verification**: Removed `email_verified_at` field for MVP simplicity
- **Retain resource fields**: All people can have skills, certifications, hourly_rate for reporting

### 4.4 vehicles

```sql
CREATE TABLE vehicles (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year SMALLINT UNSIGNED,
    license_plate VARCHAR(20),
    vin VARCHAR(17),
    capacity VARCHAR(50),
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    INDEX idx_company_id (company_id),
    INDEX idx_is_deleted (is_deleted),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### 4.5 equipment

```sql
CREATE TABLE equipment (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    condition ENUM('excellent', 'good', 'fair', 'poor'),
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    INDEX idx_company_id (company_id),
    INDEX idx_is_deleted (is_deleted),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

### 4.6 bookings

```sql
CREATE TABLE bookings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    notes TEXT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    INDEX idx_company_id (company_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_is_deleted (is_deleted),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES people(id) ON DELETE CASCADE
);
```

### 4.7 booking_people (Junction Table)

```sql
CREATE TABLE booking_people (
    booking_id BIGINT UNSIGNED NOT NULL,
    person_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,

    PRIMARY KEY (booking_id, person_id),
    INDEX idx_person_id (person_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);
```

### 4.8 booking_vehicles (Junction Table)

```sql
CREATE TABLE booking_vehicles (
    booking_id BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,

    PRIMARY KEY (booking_id, vehicle_id),
    INDEX idx_vehicle_id (vehicle_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
```

### 4.9 booking_equipment (Junction Table)

```sql
CREATE TABLE booking_equipment (
    booking_id BIGINT UNSIGNED NOT NULL,
    equipment_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,

    PRIMARY KEY (booking_id, equipment_id),
    INDEX idx_equipment_id (equipment_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);
```

### 4.10 Database Migrations (CI4 Format)

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
// app/Database/Migrations/2026-01-01-000002_CreatePeopleTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePeopleTable extends Migration
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
            'email' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                // Required for authentication
            ],
            'password' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                // Required for authentication
            ],
            'role' => [
                'type' => 'ENUM',
                'constraint' => ['admin', 'member'],
                'default' => 'member',
            ],
            'phone' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'skills' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'certifications' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'hourly_rate' => [
                'type' => 'DECIMAL',
                'constraint' => '10,2',
                'null' => true,
            ],
            'is_deleted' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
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
        $this->forge->addKey('role', false, false, 'idx_role');
        $this->forge->addKey('is_deleted', false, false, 'idx_is_deleted');
        $this->forge->addForeignKey('company_id', 'companies', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('people');
    }

    public function down()
    {
        $this->forge->dropTable('people');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000003_CreateVehiclesTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateVehiclesTable extends Migration
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
            'make' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'model' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'year' => [
                'type' => 'SMALLINT',
                'unsigned' => true,
                'null' => true,
            ],
            'license_plate' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'null' => true,
            ],
            'vin' => [
                'type' => 'VARCHAR',
                'constraint' => 17,
                'null' => true,
            ],
            'capacity' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'null' => true,
            ],
            'is_deleted' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
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
        $this->forge->addKey('is_deleted', false, false, 'idx_is_deleted');
        $this->forge->addForeignKey('company_id', 'companies', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('vehicles');
    }

    public function down()
    {
        $this->forge->dropTable('vehicles');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000004_CreateEquipmentTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateEquipmentTable extends Migration
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
            'serial_number' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'manufacturer' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'model' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
                'null' => true,
            ],
            'condition' => [
                'type' => 'ENUM',
                'constraint' => ['excellent', 'good', 'fair', 'poor'],
                'null' => true,
            ],
            'is_deleted' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
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
        $this->forge->addKey('is_deleted', false, false, 'idx_is_deleted');
        $this->forge->addForeignKey('company_id', 'companies', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('equipment');
    }

    public function down()
    {
        $this->forge->dropTable('equipment');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000005_CreateBookingsTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateBookingsTable extends Migration
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
            'created_by' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'title' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
            ],
            'start_time' => [
                'type' => 'DATETIME',
            ],
            'end_time' => [
                'type' => 'DATETIME',
            ],
            'location' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'notes' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'is_deleted' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
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
        $this->forge->addKey('start_time', false, false, 'idx_start_time');
        $this->forge->addKey('end_time', false, false, 'idx_end_time');
        $this->forge->addKey('is_deleted', false, false, 'idx_is_deleted');
        $this->forge->addForeignKey('company_id', 'companies', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('created_by', 'people', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('bookings');
    }

    public function down()
    {
        $this->forge->dropTable('bookings');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000006_CreateBookingPeopleTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateBookingPeopleTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'booking_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'person_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey(['booking_id', 'person_id']);
        $this->forge->addKey('person_id', false, false, 'idx_person_id');
        $this->forge->addForeignKey('booking_id', 'bookings', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('person_id', 'people', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('booking_people');
    }

    public function down()
    {
        $this->forge->dropTable('booking_people');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000007_CreateBookingVehiclesTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateBookingVehiclesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'booking_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'vehicle_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey(['booking_id', 'vehicle_id']);
        $this->forge->addKey('vehicle_id', false, false, 'idx_vehicle_id');
        $this->forge->addForeignKey('booking_id', 'bookings', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('vehicle_id', 'vehicles', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('booking_vehicles');
    }

    public function down()
    {
        $this->forge->dropTable('booking_vehicles');
    }
}
```

```php
<?php
// app/Database/Migrations/2026-01-01-000008_CreateBookingEquipmentTable.php
namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateBookingEquipmentTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'booking_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'equipment_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey(['booking_id', 'equipment_id']);
        $this->forge->addKey('equipment_id', false, false, 'idx_equipment_id');
        $this->forge->addForeignKey('booking_id', 'bookings', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('equipment_id', 'equipment', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('booking_equipment');
    }

    public function down()
    {
        $this->forge->dropTable('booking_equipment');
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
    "person": {
        "id": 1,
        "name": "John Doe",
        "email": "john@acme.com",
        "role": "admin",
        "company_id": 1,
        "phone": null,
        "skills": [],
        "certifications": [],
        "hourly_rate": null,
        "is_deleted": false
    },
    "company": {
        "id": 1,
        "name": "Acme Corp",
        "slug": "acme-corp"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Registration creates an admin person for the new company. Changed from `user` to `person` to reflect unified entity.

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
    "person": {
        "id": 1,
        "name": "John Doe",
        "email": "john@acme.com",
        "role": "admin",
        "company_id": 1,
        "phone": null,
        "skills": [],
        "certifications": [],
        "hourly_rate": null,
        "is_deleted": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: Changed from `user` to `person` to reflect unified entity.

---

### 5.2 People

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/people` | List all people | All |
| POST | `/api/people` | Create person | Admin |
| GET | `/api/people/{id}` | Get person details | All |
| PUT | `/api/people/{id}` | Update person | Admin |
| DELETE | `/api/people/{id}` | Soft delete person (sets is_deleted=1) | Admin |
| POST | `/api/people/{id}/undelete` | Undelete person (sets is_deleted=0) | Admin |

**GET /api/people**

Query Parameters:
- `assignable` (boolean): Filter to only members (excludes admins) for resource assignment (default: false)
- `include_deleted` (boolean): Include deleted people (default: false)
- `role` (string): Filter by role (`admin`, `member`)
- `search` (string): Search by name or email
- `per_page` (integer): Items per page (default: 25)
- `page` (integer): Page number

Response (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "John Smith",
            "email": "john.smith@acme.com",
            "role": "member",
            "phone": "+1234567890",
            "skills": ["electrical", "plumbing"],
            "certifications": ["OSHA", "First Aid"],
            "hourly_rate": 25.00,
            "is_deleted": false,
            "created_at": "2026-01-15T10:00:00Z",
            "updated_at": "2026-01-15T10:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 25,
        "total": 15,
        "last_page": 1
    }
}
```

**Usage for Resource Assignment Panels:**
```
GET /api/people?assignable=true&include_deleted=false
```
This returns only `member` role people, hiding admins from resource assignment.

**POST /api/people**

Request:
```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "role": "member",
    "phone": "+1234567890",
    "skills": ["plumbing", "welding"],
    "certifications": ["First Aid"],
    "hourly_rate": 30.00
}
```

**Required fields:** `name`, `email`, `password`
**Optional fields:** `role` (default: member), `phone`, `skills`, `certifications`, `hourly_rate`

Response (201):
```json
{
    "data": {
        "id": 5,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "member",
        "phone": "+1234567890",
        "skills": ["plumbing", "welding"],
        "certifications": ["First Aid"],
        "hourly_rate": 30.00,
        "is_deleted": false,
        "created_at": "2026-01-22T14:30:00Z",
        "updated_at": "2026-01-22T14:30:00Z"
    }
}
```

**Note**: Password is hashed before storage and never returned in responses.

---

### 5.3 Vehicles

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/vehicles` | List all vehicles | All |
| POST | `/api/vehicles` | Create vehicle | Admin |
| GET | `/api/vehicles/{id}` | Get vehicle details | All |
| PUT | `/api/vehicles/{id}` | Update vehicle | Admin |
| DELETE | `/api/vehicles/{id}` | Soft delete vehicle (sets is_deleted=1) | Admin |
| POST | `/api/vehicles/{id}/undelete` | Undelete vehicle (sets is_deleted=0) | Admin |

**GET /api/vehicles**

Query Parameters:
- `include_deleted` (boolean): Include deleted vehicles (default: false)
- `search` (string): Search by name
- `per_page` (integer): Items per page (default: 25)
- `page` (integer): Page number

Response (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "Ford F-150 #2",
            "make": "Ford",
            "model": "F-150",
            "year": 2022,
            "license_plate": "ABC-1234",
            "vin": "1FTFW1E85MFA12345",
            "capacity": "1500 lbs",
            "is_deleted": false,
            "created_at": "2026-01-15T10:00:00Z",
            "updated_at": "2026-01-15T10:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 25,
        "total": 8,
        "last_page": 1
    }
}
```

**POST /api/vehicles**

Request:
```json
{
    "name": "Ford F-150 #3",
    "make": "Ford",
    "model": "F-150",
    "year": 2024,
    "license_plate": "XYZ-789",
    "vin": "1FTFW1E85MFA54321",
    "capacity": "1500 lbs"
}
```

Response (201):
```json
{
    "data": {
        "id": 5,
        "name": "Ford F-150 #3",
        "make": "Ford",
        "model": "F-150",
        "year": 2024,
        "license_plate": "XYZ-789",
        "vin": "1FTFW1E85MFA54321",
        "capacity": "1500 lbs",
        "is_deleted": false,
        "created_at": "2026-01-22T14:30:00Z",
        "updated_at": "2026-01-22T14:30:00Z"
    }
}
```

---

### 5.4 Equipment

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/equipment` | List all equipment | All |
| POST | `/api/equipment` | Create equipment | Admin |
| GET | `/api/equipment/{id}` | Get equipment details | All |
| PUT | `/api/equipment/{id}` | Update equipment | Admin |
| DELETE | `/api/equipment/{id}` | Soft delete equipment (sets is_deleted=1) | Admin |
| POST | `/api/equipment/{id}/undelete` | Undelete equipment (sets is_deleted=0) | Admin |

**GET /api/equipment**

Query Parameters:
- `include_deleted` (boolean): Include deleted equipment (default: false)
- `condition` (string): Filter by condition (excellent, good, fair, poor)
- `search` (string): Search by name
- `per_page` (integer): Items per page (default: 25)
- `page` (integer): Page number

Response (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "Excavator #1",
            "serial_number": "EXC-001",
            "manufacturer": "CAT",
            "model": "320 Excavator",
            "condition": "good",
            "is_deleted": false,
            "created_at": "2026-01-15T10:00:00Z",
            "updated_at": "2026-01-15T10:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 25,
        "total": 12,
        "last_page": 1
    }
}
```

**POST /api/equipment**

Request:
```json
{
    "name": "Generator #3",
    "serial_number": "GEN-003",
    "manufacturer": "Honda",
    "model": "EU7000is",
    "condition": "excellent"
}
```

Response (201):
```json
{
    "data": {
        "id": 5,
        "name": "Generator #3",
        "serial_number": "GEN-003",
        "manufacturer": "Honda",
        "model": "EU7000is",
        "condition": "excellent",
        "is_deleted": false,
        "created_at": "2026-01-22T14:30:00Z",
        "updated_at": "2026-01-22T14:30:00Z"
    }
}
```

---

### 5.5 Bookings

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/bookings` | List bookings | All |
| POST | `/api/bookings` | Create booking | Admin |
| GET | `/api/bookings/{id}` | Get booking details | All |
| PUT | `/api/bookings/{id}` | Update booking | Admin |
| DELETE | `/api/bookings/{id}` | Soft delete booking (sets is_deleted=1) | Admin |
| POST | `/api/bookings/{id}/undelete` | Undelete booking (sets is_deleted=0) | Admin |
| GET | `/api/bookings/conflicts` | Check for conflicts | All |

**GET /api/bookings**

Query Parameters:
- `person_id` (integer): Filter by person
- `vehicle_id` (integer): Filter by vehicle
- `equipment_id` (integer): Filter by equipment
- `start_date` (date): Start of date range (required)
- `end_date` (date): End of date range (required)
- `include_deleted` (boolean): Include deleted bookings (default: false)
- `per_page` (integer): Items per page

Response (200):
```json
{
    "data": [
        {
            "id": 1,
            "title": "Site Visit - 123 Main St",
            "location": "123 Main St",
            "start_time": "2026-01-22T09:00:00Z",
            "end_time": "2026-01-22T12:00:00Z",
            "notes": "Bring electrical tools",
            "is_deleted": false,
            "people": [
                {
                    "id": 1,
                    "name": "John Smith",
                    "email": "john@example.com"
                }
            ],
            "vehicles": [
                {
                    "id": 2,
                    "name": "Ford F-150 #2",
                    "license_plate": "ABC-123"
                }
            ],
            "equipment": [
                {
                    "id": 5,
                    "name": "Excavator #1",
                    "serial_number": "EXC-001"
                }
            ],
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

**POST /api/bookings**

Request:
```json
{
    "title": "Site Visit",
    "location": "123 Main St",
    "start_time": "2026-01-25T10:00:00",
    "end_time": "2026-01-25T14:00:00",
    "person_ids": [1, 3],
    "vehicle_ids": [2],
    "equipment_ids": [5, 7],
    "notes": "Quarterly maintenance check"
}
```

Response (201):
```json
{
    "data": {
        "id": 15,
        "title": "Site Visit",
        "location": "123 Main St",
        "start_time": "2026-01-25T10:00:00Z",
        "end_time": "2026-01-25T14:00:00Z",
        "notes": "Quarterly maintenance check",
        "is_deleted": false,
        "people": [
            {
                "id": 1,
                "name": "John Smith",
                "email": "john@example.com"
            },
            {
                "id": 3,
                "name": "Jane Doe",
                "email": "jane@example.com"
            }
        ],
        "vehicles": [
            {
                "id": 2,
                "name": "Ford F-150 #2",
                "license_plate": "ABC-123"
            }
        ],
        "equipment": [
            {
                "id": 5,
                "name": "Excavator #1",
                "serial_number": "EXC-001"
            },
            {
                "id": 7,
                "name": "Generator #3",
                "serial_number": "GEN-003"
            }
        ],
        "created_at": "2026-01-22T14:45:00Z",
        "updated_at": "2026-01-22T14:45:00Z"
    }
}
```

**GET /api/bookings/conflicts**

Query Parameters:
- `person_ids` (array): People to check (e.g., `person_ids[]=1&person_ids[]=3`)
- `vehicle_ids` (array): Vehicles to check (e.g., `vehicle_ids[]=2`)
- `equipment_ids` (array): Equipment to check (e.g., `equipment_ids[]=5`)
- `start_time` (datetime, required): Proposed start
- `end_time` (datetime, required): Proposed end
- `exclude_id` (integer): Booking ID to exclude (for updates)

Response (200):
```json
{
    "has_conflicts": true,
    "conflicts": {
        "people": [
            {
                "id": 1,
                "name": "John Smith",
                "bookings": [
                    {
                        "id": 12,
                        "title": "Existing Appointment",
                        "start_time": "2026-01-25T11:00:00Z",
                        "end_time": "2026-01-25T13:00:00Z"
                    }
                ]
            }
        ],
        "vehicles": [],
        "equipment": []
    }
}
```

---

**Note**: User management is now handled through `/api/people` endpoints. The unified People table serves both authentication and resource scheduling purposes. Use `role` field to distinguish between admins and members.

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

### 6.2 Person Model (Unified Authentication & Resource)

**Purpose**: Unified model serving both authentication (login) and resource scheduling (job assignment).

```php
<?php
// app/Models/PersonModel.php
namespace App\Models;

use App\Entities\Person;

class PersonModel extends BaseModel
{
    protected $table         = 'people';
    protected $primaryKey    = 'id';
    protected $returnType    = Person::class;
    protected $allowedFields = [
        'company_id',
        'name',
        'email',
        'password',
        'role',
        'phone',
        'skills',
        'certifications',
        'hourly_rate',
        'is_deleted'
    ];

    protected $validationRules = [
        'name'     => 'required|max_length[255]',
        'email'    => 'required|valid_email|max_length[255]|is_unique[people.email,id,{id}]',
        'password' => 'required|min_length[8]',
        'role'     => 'permit_empty|in_list[admin,member]',
    ];

    protected $casts = [
        'skills'         => 'json-array',
        'certifications' => 'json-array',
        'is_deleted'     => 'boolean',
        'hourly_rate'    => 'float',
    ];

    protected $beforeInsert = ['setCompanyId', 'hashPassword'];
    protected $beforeUpdate = ['hashPassword'];

    /**
     * Hash password before insert/update
     */
    protected function hashPassword(array $data)
    {
        if (isset($data['data']['password'])) {
            $data['data']['password'] = password_hash($data['data']['password'], PASSWORD_DEFAULT);
        }
        return $data;
    }

    /**
     * Find person by email for authentication
     */
    public function findByEmail(string $email)
    {
        return $this->where('email', $email)->first();
    }

    /**
     * Get only assignable people (members, exclude admins)
     */
    public function assignable()
    {
        return $this->where('is_deleted', 0)
                    ->where('role', 'member');
    }

    /**
     * Get people for a company with optional filters
     */
    public function getFiltered(int $companyId, array $filters = [])
    {
        $this->where('company_id', $companyId);

        // Filter for assignable (members only)
        if (!empty($filters['assignable'])) {
            $this->where('role', 'member');
        }

        // Filter by role
        if (!empty($filters['role'])) {
            $this->where('role', $filters['role']);
        }

        if (!isset($filters['include_deleted']) || !$filters['include_deleted']) {
            $this->where('is_deleted', 0);
        }

        if (!empty($filters['search'])) {
            $this->groupStart()
                 ->like('name', $filters['search'])
                 ->orLike('email', $filters['search'])
                 ->groupEnd();
        }

        return $this;
    }

    /**
     * Get bookings for this person via junction table
     */
    public function getBookings(int $personId)
    {
        $db = \Config\Database::connect();
        return $db->table('bookings b')
                  ->select('b.*')
                  ->join('booking_people bp', 'bp.booking_id = b.id')
                  ->where('bp.person_id', $personId)
                  ->get()
                  ->getResultArray();
    }
}
```

**Person Entity** (`app/Entities/Person.php`):

```php
<?php
namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Person extends Entity
{
    protected $attributes = [
        'id'             => null,
        'company_id'     => null,
        'name'           => null,
        'email'          => null,
        'password'       => null,
        'role'           => 'member',
        'phone'          => null,
        'skills'         => [],
        'certifications' => [],
        'hourly_rate'    => null,
        'is_deleted'     => false,
    ];

    protected $casts = [
        'skills'         => 'json-array',
        'certifications' => 'json-array',
        'is_deleted'     => 'boolean',
        'hourly_rate'    => 'float',
    ];

    // Hide password in JSON responses
    protected $hidden = ['password'];

    /**
     * Check if person is admin
     */
    public function isAdmin(): bool
    {
        return $this->attributes['role'] === 'admin';
    }

    /**
     * Check if person is member
     */
    public function isMember(): bool
    {
        return $this->attributes['role'] === 'member';
    }

    /**
     * Check if person can be assigned to bookings
     */
    public function isAssignable(): bool
    {
        return $this->isMember() && !$this->attributes['is_deleted'];
    }

    /**
     * Verify password for authentication
     */
    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->attributes['password']);
    }
}
```

### 6.3 Vehicle Model

```php
<?php
// app/Models/VehicleModel.php
namespace App\Models;

class VehicleModel extends BaseModel
{
    protected $table         = 'vehicles';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'company_id',
        'name',
        'make',
        'model',
        'year',
        'license_plate',
        'vin',
        'capacity',
        'is_deleted'
    ];

    protected $validationRules = [
        'name' => 'required|max_length[255]',
    ];

    protected $casts = [
        'is_deleted'   => 'boolean',
        'year'         => 'integer',
    ];

    protected $beforeInsert = ['setCompanyId'];

    /**
     * Get vehicles for a company with optional filters
     */
    public function getFiltered(int $companyId, array $filters = [])
    {
        $this->where('company_id', $companyId);

        if (!isset($filters['include_deleted']) || !$filters['include_deleted']) {
            $this->where('is_deleted', 0);
        }

        if (!empty($filters['search'])) {
            $this->like('name', $filters['search']);
        }

        return $this;
    }

    /**
     * Get bookings for this vehicle via junction table
     */
    public function getBookings(int $vehicleId)
    {
        $db = \Config\Database::connect();
        return $db->table('bookings b')
                  ->select('b.*')
                  ->join('booking_vehicles bv', 'bv.booking_id = b.id')
                  ->where('bv.vehicle_id', $vehicleId)
                  ->get()
                  ->getResultArray();
    }
}
```

### 6.4 Equipment Model

```php
<?php
// app/Models/EquipmentModel.php
namespace App\Models;

class EquipmentModel extends BaseModel
{
    protected $table         = 'equipment';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'company_id',
        'name',
        'serial_number',
        'manufacturer',
        'model',
        'condition',
        'is_deleted'
    ];

    protected $validationRules = [
        'name'      => 'required|max_length[255]',
        'condition' => 'permit_empty|in_list[excellent,good,fair,poor]',
    ];

    protected $casts = [
        'is_deleted' => 'boolean',
    ];

    protected $beforeInsert = ['setCompanyId'];

    /**
     * Get equipment for a company with optional filters
     */
    public function getFiltered(int $companyId, array $filters = [])
    {
        $this->where('company_id', $companyId);

        if (!isset($filters['include_deleted']) || !$filters['include_deleted']) {
            $this->where('is_deleted', 0);
        }

        if (!empty($filters['condition'])) {
            $this->where('condition', $filters['condition']);
        }

        if (!empty($filters['search'])) {
            $this->like('name', $filters['search']);
        }

        return $this;
    }

    /**
     * Get bookings for this equipment via junction table
     */
    public function getBookings(int $equipmentId)
    {
        $db = \Config\Database::connect();
        return $db->table('bookings b')
                  ->select('b.*')
                  ->join('booking_equipment be', 'be.booking_id = b.id')
                  ->where('be.equipment_id', $equipmentId)
                  ->get()
                  ->getResultArray();
    }
}
```

### 6.5 Booking Model

```php
<?php
// app/Models/BookingModel.php
namespace App\Models;

class BookingModel extends BaseModel
{
    protected $table         = 'bookings';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = [
        'company_id',
        'created_by',
        'title',
        'location',
        'start_time',
        'end_time',
        'notes',
        'is_deleted'
    ];

    protected $validationRules = [
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
     * Get people attached to a booking
     */
    public function getPeople(int $bookingId): array
    {
        $db = \Config\Database::connect();
        return $db->table('booking_people bp')
                  ->select('p.id, p.name, p.email')
                  ->join('people p', 'p.id = bp.person_id')
                  ->where('bp.booking_id', $bookingId)
                  ->get()
                  ->getResultArray();
    }

    /**
     * Get vehicles attached to a booking
     */
    public function getVehicles(int $bookingId): array
    {
        $db = \Config\Database::connect();
        return $db->table('booking_vehicles bv')
                  ->select('v.id, v.name, v.license_plate')
                  ->join('vehicles v', 'v.id = bv.vehicle_id')
                  ->where('bv.booking_id', $bookingId)
                  ->get()
                  ->getResultArray();
    }

    /**
     * Get equipment attached to a booking
     */
    public function getEquipment(int $bookingId): array
    {
        $db = \Config\Database::connect();
        return $db->table('booking_equipment be')
                  ->select('e.id, e.name, e.serial_number')
                  ->join('equipment e', 'e.id = be.equipment_id')
                  ->where('be.booking_id', $bookingId)
                  ->get()
                  ->getResultArray();
    }

    /**
     * Attach all entities to a booking
     */
    public function attachEntities(int $bookingId, array $personIds, array $vehicleIds, array $equipmentIds): bool
    {
        $db = \Config\Database::connect();
        $db->transStart();

        // Attach people
        if (!empty($personIds)) {
            $bookingPersonModel = new BookingPersonModel();
            $bookingPersonModel->where('booking_id', $bookingId)->delete();
            $bookingPersonModel->attachMany($bookingId, $personIds);
        }

        // Attach vehicles
        if (!empty($vehicleIds)) {
            $bookingVehicleModel = new BookingVehicleModel();
            $bookingVehicleModel->where('booking_id', $bookingId)->delete();
            $bookingVehicleModel->attachMany($bookingId, $vehicleIds);
        }

        // Attach equipment
        if (!empty($equipmentIds)) {
            $bookingEquipmentModel = new BookingEquipmentModel();
            $bookingEquipmentModel->where('booking_id', $bookingId)->delete();
            $bookingEquipmentModel->attachMany($bookingId, $equipmentIds);
        }

        $db->transComplete();
        return $db->transStatus();
    }

    /**
     * Get bookings within a date range
     */
    public function getByDateRange(int $companyId, string $startDate, string $endDate, array $filters = [])
    {
        $this->where('company_id', $companyId)
             ->where('start_time >=', $startDate)
             ->where('end_time <=', $endDate);

        // Filter by person_id using junction table
        if (!empty($filters['person_id'])) {
            $this->join('booking_people bp', 'bp.booking_id = bookings.id')
                 ->where('bp.person_id', $filters['person_id']);
        }

        // Filter by vehicle_id using junction table
        if (!empty($filters['vehicle_id'])) {
            $this->join('booking_vehicles bv', 'bv.booking_id = bookings.id')
                 ->where('bv.vehicle_id', $filters['vehicle_id']);
        }

        // Filter by equipment_id using junction table
        if (!empty($filters['equipment_id'])) {
            $this->join('booking_equipment be', 'be.booking_id = bookings.id')
                 ->where('be.equipment_id', $filters['equipment_id']);
        }

        return $this->findAll();
    }

    /**
     * Get booking with all entity details
     */
    public function getWithEntities(int $id, int $companyId): ?array
    {
        $booking = $this->where('id', $id)
                        ->where('company_id', $companyId)
                        ->first();

        if ($booking) {
            $booking['people'] = $this->getPeople($id);
            $booking['vehicles'] = $this->getVehicles($id);
            $booking['equipment'] = $this->getEquipment($id);
        }

        return $booking;
    }
}
```

### 6.6 Booking Person Model (Junction Table)

```php
<?php
// app/Models/BookingPersonModel.php
namespace App\Models;

use CodeIgniter\Model;

class BookingPersonModel extends Model
{
    protected $table         = 'booking_people';
    protected $primaryKey    = ['booking_id', 'person_id'];
    protected $returnType    = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = [
        'booking_id',
        'person_id',
        'created_at'
    ];

    /**
     * Get all person IDs for a booking
     */
    public function getPersonIds(int $bookingId): array
    {
        return array_column(
            $this->where('booking_id', $bookingId)->findAll(),
            'person_id'
        );
    }

    /**
     * Get all booking IDs for a person
     */
    public function getBookingIds(int $personId): array
    {
        return array_column(
            $this->where('person_id', $personId)->findAll(),
            'booking_id'
        );
    }

    /**
     * Attach multiple people to a booking
     */
    public function attachMany(int $bookingId, array $personIds): bool
    {
        $data = [];
        foreach ($personIds as $personId) {
            $data[] = [
                'booking_id' => $bookingId,
                'person_id'  => $personId,
                'created_at' => date('Y-m-d H:i:s'),
            ];
        }

        return $this->insertBatch($data) !== false;
    }

    /**
     * Sync people for a booking (remove old, add new)
     */
    public function sync(int $bookingId, array $personIds): bool
    {
        $this->where('booking_id', $bookingId)->delete();
        if (empty($personIds)) return true;
        return $this->attachMany($bookingId, $personIds);
    }
}
```

### 6.7 Booking Vehicle Model (Junction Table)

```php
<?php
// app/Models/BookingVehicleModel.php
namespace App\Models;

use CodeIgniter\Model;

class BookingVehicleModel extends Model
{
    protected $table         = 'booking_vehicles';
    protected $primaryKey    = ['booking_id', 'vehicle_id'];
    protected $returnType    = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = [
        'booking_id',
        'vehicle_id',
        'created_at'
    ];

    /**
     * Get all vehicle IDs for a booking
     */
    public function getVehicleIds(int $bookingId): array
    {
        return array_column(
            $this->where('booking_id', $bookingId)->findAll(),
            'vehicle_id'
        );
    }

    /**
     * Get all booking IDs for a vehicle
     */
    public function getBookingIds(int $vehicleId): array
    {
        return array_column(
            $this->where('vehicle_id', $vehicleId)->findAll(),
            'booking_id'
        );
    }

    /**
     * Attach multiple vehicles to a booking
     */
    public function attachMany(int $bookingId, array $vehicleIds): bool
    {
        $data = [];
        foreach ($vehicleIds as $vehicleId) {
            $data[] = [
                'booking_id' => $bookingId,
                'vehicle_id' => $vehicleId,
                'created_at' => date('Y-m-d H:i:s'),
            ];
        }

        return $this->insertBatch($data) !== false;
    }

    /**
     * Sync vehicles for a booking (remove old, add new)
     */
    public function sync(int $bookingId, array $vehicleIds): bool
    {
        $this->where('booking_id', $bookingId)->delete();
        if (empty($vehicleIds)) return true;
        return $this->attachMany($bookingId, $vehicleIds);
    }
}
```

### 6.8 Booking Equipment Model (Junction Table)

```php
<?php
// app/Models/BookingEquipmentModel.php
namespace App\Models;

use CodeIgniter\Model;

class BookingEquipmentModel extends Model
{
    protected $table         = 'booking_equipment';
    protected $primaryKey    = ['booking_id', 'equipment_id'];
    protected $returnType    = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = [
        'booking_id',
        'equipment_id',
        'created_at'
    ];

    /**
     * Get all equipment IDs for a booking
     */
    public function getEquipmentIds(int $bookingId): array
    {
        return array_column(
            $this->where('booking_id', $bookingId)->findAll(),
            'equipment_id'
        );
    }

    /**
     * Get all booking IDs for an equipment
     */
    public function getBookingIds(int $equipmentId): array
    {
        return array_column(
            $this->where('equipment_id', $equipmentId)->findAll(),
            'booking_id'
        );
    }

    /**
     * Attach multiple equipment to a booking
     */
    public function attachMany(int $bookingId, array $equipmentIds): bool
    {
        $data = [];
        foreach ($equipmentIds as $equipmentId) {
            $data[] = [
                'booking_id'   => $bookingId,
                'equipment_id' => $equipmentId,
                'created_at'   => date('Y-m-d H:i:s'),
            ];
        }

        return $this->insertBatch($data) !== false;
    }

    /**
     * Sync equipment for a booking (remove old, add new)
     */
    public function sync(int $bookingId, array $equipmentIds): bool
    {
        $this->where('booking_id', $bookingId)->delete();
        if (empty($equipmentIds)) return true;
        return $this->attachMany($bookingId, $equipmentIds);
    }
}
```

### 6.9 Filters (Middleware equivalent)

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

### 6.10 Filter Configuration

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

    // People
    $routes->get('people', 'PersonController::index');
    $routes->get('people/(:num)', 'PersonController::show/$1');
    $routes->post('people', 'PersonController::create', ['filter' => 'admin']);
    $routes->put('people/(:num)', 'PersonController::update/$1', ['filter' => 'admin']);
    $routes->delete('people/(:num)', 'PersonController::delete/$1', ['filter' => 'admin']);

    // Vehicles
    $routes->get('vehicles', 'VehicleController::index');
    $routes->get('vehicles/(:num)', 'VehicleController::show/$1');
    $routes->post('vehicles', 'VehicleController::create', ['filter' => 'admin']);
    $routes->put('vehicles/(:num)', 'VehicleController::update/$1', ['filter' => 'admin']);
    $routes->delete('vehicles/(:num)', 'VehicleController::delete/$1', ['filter' => 'admin']);

    // Equipment
    $routes->get('equipment', 'EquipmentController::index');
    $routes->get('equipment/(:num)', 'EquipmentController::show/$1');
    $routes->post('equipment', 'EquipmentController::create', ['filter' => 'admin']);
    $routes->put('equipment/(:num)', 'EquipmentController::update/$1', ['filter' => 'admin']);
    $routes->delete('equipment/(:num)', 'EquipmentController::delete/$1', ['filter' => 'admin']);

    // Bookings
    $routes->get('bookings', 'BookingController::index');
    $routes->get('bookings/conflicts', 'BookingController::conflicts');
    $routes->get('bookings/(:num)', 'BookingController::show/$1');
    $routes->post('bookings', 'BookingController::create', ['filter' => 'admin']);
    $routes->put('bookings/(:num)', 'BookingController::update/$1', ['filter' => 'admin']);
    $routes->delete('bookings/(:num)', 'BookingController::delete/$1', ['filter' => 'admin']);

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

use App\Models\BookingModel;
use App\Models\PersonModel;
use App\Models\VehicleModel;
use App\Models\EquipmentModel;
use CodeIgniter\I18n\Time;

/**
 * Basic conflict detection for booking overlaps
 *
 * NOTE: This is a simplified implementation for initial MVP.
 * Detailed conflict resolution behavior and edge cases will be
 * defined and implemented after basic features are established.
 */
class ConflictDetection
{
    protected BookingModel $bookingModel;
    protected PersonModel $personModel;
    protected VehicleModel $vehicleModel;
    protected EquipmentModel $equipmentModel;

    public function __construct()
    {
        $this->bookingModel = new BookingModel();
        $this->personModel = new PersonModel();
        $this->vehicleModel = new VehicleModel();
        $this->equipmentModel = new EquipmentModel();
    }

    /**
     * Find conflicting bookings for a person
     */
    public function findConflictsForPerson(
        int $personId,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): array {
        $db = \Config\Database::connect();
        $builder = $db->table('bookings b');

        $builder->select('b.*')
                ->join('booking_people bp', 'bp.booking_id = b.id')
                ->where('bp.person_id', $personId)
                ->where('b.start_time <', $endTime)
                ->where('b.end_time >', $startTime);

        if ($excludeBookingId) {
            $builder->where('b.id !=', $excludeBookingId);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Find conflicting bookings for a vehicle
     */
    public function findConflictsForVehicle(
        int $vehicleId,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): array {
        $db = \Config\Database::connect();
        $builder = $db->table('bookings b');

        $builder->select('b.*')
                ->join('booking_vehicles bv', 'bv.booking_id = b.id')
                ->where('bv.vehicle_id', $vehicleId)
                ->where('b.start_time <', $endTime)
                ->where('b.end_time >', $startTime);

        if ($excludeBookingId) {
            $builder->where('b.id !=', $excludeBookingId);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Find conflicting bookings for equipment
     */
    public function findConflictsForEquipment(
        int $equipmentId,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): array {
        $db = \Config\Database::connect();
        $builder = $db->table('bookings b');

        $builder->select('b.*')
                ->join('booking_equipment be', 'be.booking_id = b.id')
                ->where('be.equipment_id', $equipmentId)
                ->where('b.start_time <', $endTime)
                ->where('b.end_time >', $startTime);

        if ($excludeBookingId) {
            $builder->where('b.id !=', $excludeBookingId);
        }

        return $builder->get()->getResultArray();
    }

    /**
     * Find all conflicts for people, vehicles, and equipment
     * Returns conflicts grouped by entity type
     */
    public function findConflicts(
        array $personIds,
        array $vehicleIds,
        array $equipmentIds,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): array {
        $conflicts = [
            'people' => [],
            'vehicles' => [],
            'equipment' => [],
        ];

        // Check people conflicts
        foreach ($personIds as $personId) {
            $personConflicts = $this->findConflictsForPerson(
                $personId, $startTime, $endTime, $excludeBookingId
            );
            if (!empty($personConflicts)) {
                $person = $this->personModel->find($personId);
                $conflicts['people'][] = [
                    'id' => $personId,
                    'name' => $person['name'] ?? 'Unknown',
                    'bookings' => $personConflicts,
                ];
            }
        }

        // Check vehicle conflicts
        foreach ($vehicleIds as $vehicleId) {
            $vehicleConflicts = $this->findConflictsForVehicle(
                $vehicleId, $startTime, $endTime, $excludeBookingId
            );
            if (!empty($vehicleConflicts)) {
                $vehicle = $this->vehicleModel->find($vehicleId);
                $conflicts['vehicles'][] = [
                    'id' => $vehicleId,
                    'name' => $vehicle['name'] ?? 'Unknown',
                    'bookings' => $vehicleConflicts,
                ];
            }
        }

        // Check equipment conflicts
        foreach ($equipmentIds as $equipmentId) {
            $equipmentConflicts = $this->findConflictsForEquipment(
                $equipmentId, $startTime, $endTime, $excludeBookingId
            );
            if (!empty($equipmentConflicts)) {
                $equipment = $this->equipmentModel->find($equipmentId);
                $conflicts['equipment'][] = [
                    'id' => $equipmentId,
                    'name' => $equipment['name'] ?? 'Unknown',
                    'bookings' => $equipmentConflicts,
                ];
            }
        }

        return $conflicts;
    }

    /**
     * Check if there are any conflicts for any entity
     */
    public function hasConflicts(
        array $personIds,
        array $vehicleIds,
        array $equipmentIds,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): bool {
        // Check people
        foreach ($personIds as $personId) {
            if (!empty($this->findConflictsForPerson(
                $personId, $startTime, $endTime, $excludeBookingId
            ))) {
                return true;
            }
        }

        // Check vehicles
        foreach ($vehicleIds as $vehicleId) {
            if (!empty($this->findConflictsForVehicle(
                $vehicleId, $startTime, $endTime, $excludeBookingId
            ))) {
                return true;
            }
        }

        // Check equipment
        foreach ($equipmentIds as $equipmentId) {
            if (!empty($this->findConflictsForEquipment(
                $equipmentId, $startTime, $endTime, $excludeBookingId
            ))) {
                return true;
            }
        }

        return false;
    }
}
```

### 8.2 Booking Service

```php
<?php
// app/Libraries/BookingService.php
namespace App\Libraries;

use App\Models\BookingModel;
use App\Models\BookingPersonModel;
use App\Models\BookingVehicleModel;
use App\Models\BookingEquipmentModel;
use CodeIgniter\I18n\Time;

class BookingService
{
    protected BookingModel $bookingModel;
    protected BookingPersonModel $bookingPersonModel;
    protected BookingVehicleModel $bookingVehicleModel;
    protected BookingEquipmentModel $bookingEquipmentModel;
    protected ConflictDetection $conflictDetection;

    public function __construct()
    {
        $this->bookingModel = new BookingModel();
        $this->bookingPersonModel = new BookingPersonModel();
        $this->bookingVehicleModel = new BookingVehicleModel();
        $this->bookingEquipmentModel = new BookingEquipmentModel();
        $this->conflictDetection = new ConflictDetection();
    }

    /**
     * Create a new booking with conflict checking
     * @param array $data Booking data including 'person_ids', 'vehicle_ids', 'equipment_ids'
     */
    public function createBooking(array $data): array
    {
        $personIds = $data['person_ids'] ?? [];
        $vehicleIds = $data['vehicle_ids'] ?? [];
        $equipmentIds = $data['equipment_ids'] ?? [];

        if (empty($personIds) && empty($vehicleIds) && empty($equipmentIds)) {
            throw new \InvalidArgumentException('At least one person, vehicle, or equipment is required');
        }

        // Check for conflicts across all entities
        if ($this->conflictDetection->hasConflicts(
            $personIds,
            $vehicleIds,
            $equipmentIds,
            $data['start_time'],
            $data['end_time']
        )) {
            throw new \RuntimeException('Booking conflicts with existing bookings');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // Remove entity IDs from booking data (not columns in bookings table)
        unset($data['person_ids'], $data['vehicle_ids'], $data['equipment_ids']);

        $bookingId = $this->bookingModel->insert($data);

        // Attach entities to booking via junction tables
        if (!empty($personIds)) {
            $this->bookingPersonModel->attachMany($bookingId, $personIds);
        }
        if (!empty($vehicleIds)) {
            $this->bookingVehicleModel->attachMany($bookingId, $vehicleIds);
        }
        if (!empty($equipmentIds)) {
            $this->bookingEquipmentModel->attachMany($bookingId, $equipmentIds);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new \RuntimeException('Failed to create booking');
        }

        $booking = $this->bookingModel->find($bookingId);
        $booking['people'] = $this->bookingModel->getPeople($bookingId);
        $booking['vehicles'] = $this->bookingModel->getVehicles($bookingId);
        $booking['equipment'] = $this->bookingModel->getEquipment($bookingId);

        return $booking;
    }

    /**
     * Update a booking
     * @param array $data Booking data, may include entity ID arrays
     */
    public function updateBooking(int $id, array $data): array
    {
        $personIds = $data['person_ids'] ?? null;
        $vehicleIds = $data['vehicle_ids'] ?? null;
        $equipmentIds = $data['equipment_ids'] ?? null;

        // Check for conflicts if time or entities changed
        if (isset($data['start_time']) && isset($data['end_time'])) {
            $checkPersonIds = $personIds ?? $this->bookingPersonModel->getPersonIds($id);
            $checkVehicleIds = $vehicleIds ?? $this->bookingVehicleModel->getVehicleIds($id);
            $checkEquipmentIds = $equipmentIds ?? $this->bookingEquipmentModel->getEquipmentIds($id);

            if ($this->conflictDetection->hasConflicts(
                $checkPersonIds,
                $checkVehicleIds,
                $checkEquipmentIds,
                $data['start_time'],
                $data['end_time'],
                $id
            )) {
                throw new \RuntimeException('Booking conflicts with existing bookings');
            }
        }

        // Remove entity IDs from booking data
        unset($data['person_ids'], $data['vehicle_ids'], $data['equipment_ids']);

        $this->bookingModel->update($id, $data);

        // Update entities if provided
        if ($personIds !== null) {
            $this->bookingPersonModel->sync($id, $personIds);
        }
        if ($vehicleIds !== null) {
            $this->bookingVehicleModel->sync($id, $vehicleIds);
        }
        if ($equipmentIds !== null) {
            $this->bookingEquipmentModel->sync($id, $equipmentIds);
        }

        $booking = $this->bookingModel->find($id);
        $booking['people'] = $this->bookingModel->getPeople($id);
        $booking['vehicles'] = $this->bookingModel->getVehicles($id);
        $booking['equipment'] = $this->bookingModel->getEquipment($id);

        return $booking;
    }

    /**
     * Get detailed conflict information for all entity types
     */
    public function getConflictDetails(
        array $personIds,
        array $vehicleIds,
        array $equipmentIds,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null
    ): array {
        return $this->conflictDetection->findConflicts(
            $personIds,
            $vehicleIds,
            $equipmentIds,
            $startTime,
            $endTime,
            $excludeBookingId
        );
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

    // Person validation rules
    public array $person = [
        'name' => 'required|max_length[255]',
        'email' => 'permit_empty|valid_email|max_length[255]',
        'is_deleted' => 'permit_empty|in_list[0,1]',
    ];

    public array $person_errors = [
        'name' => [
            'required' => 'Name is required.',
            'max_length' => 'Name cannot exceed 255 characters.',
        ],
        'email' => [
            'valid_email' => 'Please enter a valid email address.',
        ],
    ];

    // Vehicle validation rules
    public array $vehicle = [
        'name' => 'required|max_length[255]',
        'year' => 'permit_empty|integer|greater_than[1900]|less_than[2100]',
        'is_deleted' => 'permit_empty|in_list[0,1]',
    ];

    public array $vehicle_errors = [
        'name' => [
            'required' => 'Vehicle name is required.',
            'max_length' => 'Vehicle name cannot exceed 255 characters.',
        ],
        'year' => [
            'integer' => 'Year must be a valid number.',
        ],
    ];

    // Equipment validation rules
    public array $equipment = [
        'name' => 'required|max_length[255]',
        'condition' => 'permit_empty|in_list[excellent,good,fair,poor]',
        'is_deleted' => 'permit_empty|in_list[0,1]',
    ];

    public array $equipment_errors = [
        'name' => [
            'required' => 'Equipment name is required.',
            'max_length' => 'Equipment name cannot exceed 255 characters.',
        ],
        'condition' => [
            'in_list' => 'Condition must be excellent, good, fair, or poor.',
        ],
    ];

    // Booking validation rules
    public array $booking = [
        'title' => 'required|max_length[255]',
        'start_time' => 'required|valid_date',
        'end_time' => 'required|valid_date',
        'location' => 'permit_empty|max_length[255]',
        'person_ids.*' => 'permit_empty|integer',
        'vehicle_ids.*' => 'permit_empty|integer',
        'equipment_ids.*' => 'permit_empty|integer',
        'is_deleted' => 'permit_empty|in_list[0,1]',
    ];

    public array $booking_errors = [
        'title' => [
            'required' => 'Title is required.',
            'max_length' => 'Title cannot exceed 255 characters.',
        ],
        'start_time' => [
            'required' => 'Start time is required.',
            'valid_date' => 'Start time must be a valid date.',
        ],
        'end_time' => [
            'required' => 'End time is required.',
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

### 9.2 Controller Validation Example (PersonController)

```php
<?php
// app/Controllers/PersonController.php
namespace App\Controllers;

use App\Models\PersonModel;
use CodeIgniter\RESTful\ResourceController as BaseResourceController;

class PersonController extends BaseResourceController
{
    protected PersonModel $personModel;

    public function __construct()
    {
        $this->personModel = new PersonModel();
    }

    public function index()
    {
        $session = session();
        $user = $session->get('user');

        $filters = [
            'include_deleted' => $this->request->getGet('include_deleted'),
            'search'          => $this->request->getGet('search'),
        ];

        $perPage = (int) ($this->request->getGet('per_page') ?? 25);

        $people = $this->personModel
            ->getFiltered($user['company_id'], $filters)
            ->paginate($perPage);

        $pager = $this->personModel->pager;

        return $this->respond([
            'data' => $people,
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

        if (!$this->validate('person')) {
            return $this->failValidation($validation->getErrors());
        }

        $session = session();
        $user = $session->get('user');

        $data = [
            'company_id'     => $user['company_id'],
            'name'           => $this->request->getPost('name'),
            'email'          => $this->request->getPost('email'),
            'phone'          => $this->request->getPost('phone'),
            'skills'         => $this->request->getPost('skills'),
            'certifications' => $this->request->getPost('certifications'),
            'hourly_rate'    => $this->request->getPost('hourly_rate'),
            'is_deleted'     => $this->request->getPost('is_deleted') ?? 0,
        ];

        $id = $this->personModel->insert($data);

        if (!$id) {
            return $this->failServerError('Failed to create person');
        }

        $person = $this->personModel->find($id);

        return $this->respondCreated([
            'data' => $person,
        ]);
    }

    public function show($id = null)
    {
        $session = session();
        $user = $session->get('user');

        $person = $this->personModel->findByCompany($id, $user['company_id']);

        if (!$person) {
            return $this->failNotFound('Person not found');
        }

        return $this->respond([
            'data' => $person,
        ]);
    }

    public function update($id = null)
    {
        $session = session();
        $user = $session->get('user');

        $person = $this->personModel->findByCompany($id, $user['company_id']);

        if (!$person) {
            return $this->failNotFound('Person not found');
        }

        $data = $this->request->getJSON(true);

        if (!$this->personModel->update($id, $data)) {
            return $this->failValidation($this->personModel->errors());
        }

        return $this->respond([
            'data' => $this->personModel->find($id),
        ]);
    }

    public function delete($id = null)
    {
        $session = session();
        $user = $session->get('user');

        $person = $this->personModel->findByCompany($id, $user['company_id']);

        if (!$person) {
            return $this->failNotFound('Person not found');
        }

        $this->personModel->delete($id);

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
- Member role can only read resources and bookings
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
- CRUD operations for people
- CRUD operations for vehicles
- CRUD operations for equipment
- CRUD operations for bookings
- Conflict detection logic across all entity types
- Multi-tenant isolation
- Role-based access control

### 14.2 Example Test

```php
<?php
// tests/Feature/BookingConflictTest.php
namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Test\DatabaseTestTrait;
use App\Models\PersonModel;
use App\Models\VehicleModel;
use App\Models\BookingModel;
use App\Models\BookingPersonModel;

class BookingConflictTest extends CIUnitTestCase
{
    use FeatureTestTrait;
    use DatabaseTestTrait;

    protected $refresh = true;

    public function testPreventsOverlappingBookingsForPerson(): void
    {
        // Create test data
        $personModel = new PersonModel();
        $bookingModel = new BookingModel();
        $bookingPersonModel = new BookingPersonModel();

        $companyId = 1; // Assuming seeded company

        // Create admin person for authentication
        $adminId = $personModel->insert([
            'company_id' => $companyId,
            'email' => 'admin@test.com',
            'password' => 'password', // Will be hashed by model
            'name' => 'Test Admin',
            'role' => 'admin',
        ]);

        // Create member person to be assigned to bookings
        $personId = $personModel->insert([
            'company_id' => $companyId,
            'name' => 'John Smith',
            'email' => 'john@test.com',
            'password' => 'password',
            'role' => 'member',
        ]);

        // Create first booking
        $bookingId = $bookingModel->insert([
            'company_id' => $companyId,
            'created_by' => $adminId,
            'title' => 'Existing Booking',
            'start_time' => '2026-01-25 10:00:00',
            'end_time' => '2026-01-25 12:00:00',
        ]);

        // Attach person to booking via junction table
        $bookingPersonModel->attachMany($bookingId, [$personId]);

        // Generate JWT token for auth
        $token = $this->generateTestToken($adminId, $companyId, 'admin');

        // Attempt overlapping booking
        $result = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/bookings', [
            'person_ids' => [$personId],
            'vehicle_ids' => [],
            'equipment_ids' => [],
            'title' => 'Overlapping Booking',
            'start_time' => '2026-01-25 11:00:00',
            'end_time' => '2026-01-25 13:00:00',
        ]);

        $result->assertStatus(422);
    }

    public function testAllowsNonOverlappingBookingsForDifferentEntities(): void
    {
        $personModel = new PersonModel();
        $vehicleModel = new VehicleModel();
        $bookingModel = new BookingModel();
        $bookingPersonModel = new BookingPersonModel();

        $companyId = 1;

        $userId = $userModel->insert([
            'company_id' => $companyId,
            'email' => 'admin2@test.com',
            'password' => password_hash('password', PASSWORD_DEFAULT),
            'name' => 'Test Admin 2',
            'role' => 'admin',
        ]);

        $personId = $personModel->insert([
            'company_id' => $companyId,
            'name' => 'Jane Doe',
            'email' => 'jane@test.com',
        ]);

        $vehicleId = $vehicleModel->insert([
            'company_id' => $companyId,
            'name' => 'Ford F-150',
            'license_plate' => 'ABC-123',
        ]);

        // Create booking with person only
        $bookingId = $bookingModel->insert([
            'company_id' => $companyId,
            'created_by' => $userId,
            'title' => 'Person Only Booking',
            'start_time' => '2026-01-25 10:00:00',
            'end_time' => '2026-01-25 12:00:00',
        ]);

        $bookingPersonModel->attachMany($bookingId, [$personId]);

        $token = $this->generateTestToken($userId, $companyId, 'admin');

        // Book vehicle at same time - should succeed (different entity)
        $result = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/bookings', [
            'person_ids' => [],
            'vehicle_ids' => [$vehicleId],
            'equipment_ids' => [],
            'title' => 'Vehicle Only Booking',
            'start_time' => '2026-01-25 10:00:00',
            'end_time' => '2026-01-25 12:00:00',
        ]);

        $result->assertStatus(201);
    }

    private function generateTestToken(int $userId, int $companyId, string $role): string
    {
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
php spark test tests/Feature/BookingConflictTest.php

# Run with coverage
php spark test --coverage-html writable/coverage
```

---

*Document Version: 3.0*
*Framework: CodeIgniter 4*
*Last Updated: January 2026*
*Change: Separated resources into People, Vehicles, and Equipment entities*
