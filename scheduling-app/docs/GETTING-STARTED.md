# Getting Started with SchedulePro Development

---

## 🎯 Quick Start Guide

This document provides a quick reference for initializing and developing SchedulePro. For detailed instructions, refer to the specific documents listed below.

---

## 📚 Documentation Map

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **THIS FILE** | Quick reference and overview | Starting point, quick command lookup |
| `initialization-checklist.md` | Step-by-step initialization guide | First-time project setup |
| `backend-implementation-plan.md` | Backend development roadmap | Planning and tracking backend work |
| `frontend-implementation-plan.md` | Frontend development roadmap | Planning and tracking frontend work |
| `frontend-initialization-guide.md` | Detailed Vite + Backbone setup | Troubleshooting frontend, understanding integration |
| `prd/PRD-backend.md` | Complete backend specification | Reference for API endpoints, models, schema |
| `prd/PRD-frontend.md` | Complete frontend specification | Reference for components, user stories, features |

---

## 🚀 Initialization Quick Commands

### Backend (CodeIgniter 4 + MySQL)

```bash
# Navigate to backend directory
cd schpro-backend

# Create project
composer create-project codeigniter4/appstarter .

# Install JWT library
composer require firebase/php-jwt

# Configure environment
cp env .env
# Edit .env with your settings (see template below)

# Create database
mysql -u root -p
CREATE DATABASE schedulepro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Create and run migrations (see PRD Section 4 for schema)
php spark make:migration CreateCompaniesTable
# ... create all 8 migrations ...
php spark migrate

# Start server
php spark serve
# Access at http://localhost:8080
```

**Backend .env Template:**
```env
CI_ENVIRONMENT = development
app.baseURL = 'http://localhost:8080/'
database.default.hostname = localhost
database.default.database = schedulepro
database.default.username = root
database.default.password = your_password_here
jwt.secret = generate_with_openssl_rand_base64_32
jwt.expire = 86400
cors.allowedOrigins = http://localhost:5173
```

---

### Frontend (Vite + React + Backbone.js)

```bash
# Navigate to frontend directory
cd schpro-frontend

# Create project
npm create vite@latest . -- --template react

# Install dependencies
npm install
npm install backbone underscore axios
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Configure environment
cp .env.example .env
# Edit .env with API URL

# Create project structure
mkdir -p src/{components/{Auth,BookingsList,ResourceList,BookingForm,ResourceAssignment,Dashboard,common,Layout},models,collections,hooks,router,services,views,utils}

# Start server
npm run dev
# Access at http://localhost:5173
```

**Frontend .env Template:**
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEV_MODE=true
VITE_APP_NAME=SchedulePro
```

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [x] PHP 8.1+ (`php -v`)
- [x] Composer (`composer --version`)
- [x] MySQL 8.0+ or MariaDB 10.6+ (running)
- [x] Node.js 18+ (`node -v`)
- [x] npm 9+ (`npm -v`)
- [x] Git (optional) (`git --version`)

---

## 🗂️ Project Structure Overview

```
scheduling-app/
├── schpro-backend/          # CodeIgniter 4 API
│   ├── app/
│   │   ├── Controllers/     # API endpoints
│   │   ├── Models/          # Database models
│   │   ├── Entities/        # Data entities
│   │   ├── Filters/         # Auth, CORS, Company isolation
│   │   ├── Libraries/       # ConflictDetection, BookingService
│   │   ├── Database/
│   │   │   ├── Migrations/  # Database schema
│   │   │   └── Seeds/       # Test data
│   │   └── Config/          # Configuration files
│   ├── .env                 # Environment config (not in git)
│   └── spark                # CLI tool
│
├── schpro-frontend/         # React + Vite + Backbone.js
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── models/          # Backbone models
│   │   ├── collections/     # Backbone collections
│   │   ├── hooks/           # React-Backbone integration
│   │   ├── services/        # API service, backboneSync
│   │   ├── router/          # Backbone router
│   │   ├── views/           # Page views
│   │   └── utils/           # Helper functions
│   ├── .env                 # Environment config (not in git)
│   └── package.json
│
├── landing-page/            # Next.js marketing site (already initialized)
│
└── docs/                    # All documentation
    ├── GETTING-STARTED.md   # THIS FILE
    ├── initialization-checklist.md
    ├── backend-implementation-plan.md
    ├── frontend-implementation-plan.md
    ├── frontend-initialization-guide.md
    └── prd/
        ├── PRD-backend.md
        └── PRD-frontend.md
```

---

## 🏗️ Development Workflow

### Day 1-2: Project Setup
1. ✅ Complete `initialization-checklist.md`
2. ✅ Verify both servers running
3. ✅ Test frontend-backend connection

### Week 1-2: Authentication
**Backend:**
- Create JWT helpers and filters
- Implement register/login/logout endpoints
- Test with Postman

**Frontend:**
- Create Backbone models/collections
- Build login form component
- Implement token management

### Week 2-3: Multi-Tenancy & People Management
**Backend:**
- Implement company scoping
- Create PersonModel and PersonController
- Implement CRUD + soft delete

**Frontend:**
- Create Person model and collection
- Build people list component
- Build person form component

### Week 3-5: Resources (Vehicles & Equipment)
Follow same pattern as People management.

### Week 5-7: Booking Management
**Backend:**
- Create BookingModel and junction models
- Implement BookingService
- Implement conflict detection

**Frontend:**
- Create Booking model and collection
- Build booking form with resource assignment
- Build bookings list view

### Week 8+: Testing & Polish
- Write tests (backend and frontend)
- Create database seeders
- UI polish and optimization
- Documentation updates

---

## 🔧 Common Commands

### Backend Commands

```bash
# Start development server
php spark serve

# Run migrations
php spark migrate
php spark migrate:status
php spark migrate:rollback

# Create new migration
php spark make:migration CreateTableName

# Create new controller
php spark make:controller ControllerName

# Create new model
php spark make:model ModelName

# Seed database
php spark db:seed DatabaseSeeder

# Run tests
php spark test
php spark test --coverage-html writable/coverage

# View routes
php spark routes
```

### Frontend Commands

```bash
# Start development server
npm run dev

# Create production build
npm run build

# Preview production build
npm run preview

# Run tests (when configured)
npm run test

# Lint code (when configured)
npm run lint
```

---

## 🔍 API Testing

### Using Postman/Insomnia

**1. Register:**
```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "company_name": "Acme Corp",
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "securepassword123"
}
```

**2. Login:**
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "john@acme.com",
  "password": "securepassword123"
}

# Response includes token:
# { "token": "eyJ0eXAiOiJKV1Q..." }
```

**3. Protected endpoint:**
```http
GET http://localhost:8080/api/people
Authorization: Bearer eyJ0eXAiOiJKV1Q...
```

### Using curl

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme","name":"John","email":"john@acme.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@acme.com","password":"password123"}'

# Get people (with token)
curl -X GET http://localhost:8080/api/people \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🐛 Troubleshooting Quick Fixes

### Backend Issues

**Problem: Database connection failed**
```bash
# Check MySQL is running
systemctl status mysql   # Linux
brew services list        # Mac
# Services app             # Windows

# Test connection
mysql -u root -p
```

**Problem: Migration failed**
```bash
# Check migration status
php spark migrate:status

# Rollback last migration
php spark migrate:rollback

# Check table exists
mysql -u root -p schedulepro
SHOW TABLES;
```

**Problem: Port 8080 already in use**
```bash
# Use different port
php spark serve --port=8081

# Update frontend .env
VITE_API_BASE_URL=http://localhost:8081/api
```

---

### Frontend Issues

**Problem: CORS errors**
```javascript
// 1. Check vite.config.js has proxy configured
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}

// 2. Check backend CORS filter is enabled
// See PRD-backend.md Section 13.0

// 3. Restart both servers
```

**Problem: Environment variables undefined**
```bash
# 1. Check variable starts with VITE_
# 2. Restart dev server after changing .env
# 3. Access via import.meta.env.VITE_VARIABLE_NAME
```

**Problem: Backbone not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm install backbone underscore axios
```

---

## 📖 Key Concepts

### Multi-Tenancy
- Every API request scoped to user's company
- `company_id` stored in JWT token
- Automatic filtering in models via `CompanyFilter`

### Soft Delete
- All entities use `is_deleted` flag (0 = active, 1 = deleted)
- Deleted items excluded by default
- Undelete functionality restores items
- Preserved for audit trail

### JWT Authentication
- Stateless authentication
- Token payload: `{ sub: user_id, company_id, role, exp }`
- Token stored in localStorage (frontend)
- Sent in `Authorization: Bearer <token>` header

### Backbone + React Integration
- Backbone manages data layer (models, collections, sync)
- React handles UI layer (components, rendering)
- React hooks bridge Backbone events to React state
- `useBackboneModel` and `useBackboneCollection` hooks

### Conflict Detection
- Checks time overlap for same entity
- Separate checks for people, vehicles, equipment
- Returns 422 with conflict details
- User can view conflicts but cannot proceed (for MVP)

---

## 🎯 Implementation Milestones

### Milestone 1: Project Initialized ✅
- Backend and frontend servers running
- Database created with migrations
- Basic integration verified

### Milestone 2: Authentication Working (Week 1-2)
- Users can register and login
- JWT tokens generated and validated
- Protected routes enforced

### Milestone 3: Resources Management (Week 3-5)
- CRUD for people, vehicles, equipment
- Soft delete and undelete working
- Admin permissions enforced

### Milestone 4: Booking Management (Week 5-7)
- Create bookings with multiple entities
- Basic conflict detection working
- Bookings list view functional

### Milestone 5: MVP Complete (Week 8+)
- All tests passing
- Database seeders created
- Basic UI polish done
- Ready for user testing

---

## 📞 Support Resources

- **Backend PRD**: Full API specification
- **Frontend PRD**: Complete UI specification
- **Implementation Plans**: Phase-by-phase guides
- **Initialization Checklist**: Step-by-step setup
- **Frontend Integration Guide**: Vite + Backbone details

---

## 🚦 Current Status

**Before initialization:**
- [x] All PRDs complete
- [x] All implementation plans complete
- [x] All initialization guides complete
- [ ] Backend project initialized
- [ ] Frontend project initialized
- [ ] Integration verified

**Ready to proceed with initialization!**

---

## 🎉 Next Steps

1. **Read this document** to understand the overview
2. **Open `initialization-checklist.md`** and follow step-by-step
3. **Complete backend initialization** (~30-45 minutes)
4. **Complete frontend initialization** (~30-45 minutes)
5. **Verify integration** (~15 minutes)
6. **Start implementing** following the implementation plans!

---

*Document Version: 1.0*
*Created: January 2026*
*Total Setup Time: 1-2 hours*
*Estimated MVP Completion: 11-12 weeks (frontend) + 6 weeks (backend)*

**You're fully ready to build SchedulePro! 🚀**
