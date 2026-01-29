# SchedulePro Project Initialization Checklist

---

## Overview

This checklist guides you through initializing both the backend and frontend projects for SchedulePro. Complete each step in order and check off items as you go.

---

## ✅ Pre-Initialization Verification

### Documentation Complete
- [x] Backend PRD complete (`docs/prd/PRD-backend.md`)
- [x] Frontend PRD complete (`docs/prd/PRD-frontend.md`)
- [x] Backend implementation plan created (`docs/backend-implementation-plan.md`)
- [x] Frontend implementation plan exists (`docs/frontend-implementation-plan.md`)
- [x] Frontend initialization guide created (`docs/frontend-initialization-guide.md`)
- [x] Backend PRD Section 13.0 updated with init instructions

### Prerequisites Installed
- [ ] PHP 8.1+ installed (`php -v`)
- [ ] Composer installed (`composer --version`)
- [ ] MySQL 8.0+ or MariaDB 10.6+ installed and running
- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm 9+ installed (`npm -v`)
- [ ] Git installed (optional) (`git --version`)

### Directories Created
- [x] `schpro-backend/` directory exists (empty)
- [x] `schpro-frontend/` directory exists (empty)
- [x] `landing-page/` directory exists (Next.js already initialized)
- [x] `docs/` directory exists with all PRDs

---

## 📦 Backend Initialization

### Phase 1: Create CodeIgniter 4 Project

- [ ] Navigate to `schpro-backend/` directory
- [ ] Run `composer create-project codeigniter4/appstarter .`
  - ⏱️ Estimated time: 2-3 minutes
  - ✅ Success indicator: `vendor/` folder created, `spark` command available

### Phase 2: Install Dependencies

- [ ] Run `composer require firebase/php-jwt`
  - ✅ Success indicator: `firebase/php-jwt` in `composer.json`

### Phase 3: Configure Environment

- [ ] Copy environment template: `cp env .env`
- [ ] Generate JWT secret: `openssl rand -base64 32`
- [ ] Copy the generated secret key
- [ ] Edit `.env` file with configuration:
  - [ ] Set `CI_ENVIRONMENT = development`
  - [ ] Set `app.baseURL = 'http://localhost:8080/'`
  - [ ] Set `database.default.hostname = localhost`
  - [ ] Set `database.default.database = schedulepro`
  - [ ] Set `database.default.username = root` (or your MySQL user)
  - [ ] Set `database.default.password = ` (your MySQL password)
  - [ ] Set `jwt.secret = ` (paste generated secret)
  - [ ] Set `jwt.expire = 86400`
  - [ ] Set `cors.allowedOrigins = http://localhost:5173`
- [ ] Save `.env` file

**Reference:** `docs/prd/PRD-backend.md` Section 13.0

### Phase 4: Create Database

- [ ] Connect to MySQL: `mysql -u root -p`
- [ ] Run: `CREATE DATABASE schedulepro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
- [ ] Verify: `SHOW DATABASES;` (should see `schedulepro`)
- [ ] Exit MySQL: `exit;`

### Phase 5: Create Migrations

⚠️ **Important:** Follow the exact schema from `docs/prd/PRD-backend.md` Section 4.

- [ ] Create migration for `companies` table
  - Command: `php spark make:migration CreateCompaniesTable`
- [ ] Create migration for `people` table
  - Command: `php spark make:migration CreatePeopleTable`
- [ ] Create migration for `vehicles` table
  - Command: `php spark make:migration CreateVehiclesTable`
- [ ] Create migration for `equipment` table
  - Command: `php spark make:migration CreateEquipmentTable`
- [ ] Create migration for `bookings` table
  - Command: `php spark make:migration CreateBookingsTable`
- [ ] Create migration for `booking_people` junction table
  - Command: `php spark make:migration CreateBookingPeopleTable`
- [ ] Create migration for `booking_vehicles` junction table
  - Command: `php spark make:migration CreateBookingVehiclesTable`
- [ ] Create migration for `booking_equipment` junction table
  - Command: `php spark make:migration CreateBookingEquipmentTable`

### Phase 6: Run Migrations

- [ ] Run all migrations: `php spark migrate`
- [ ] Check migration status: `php spark migrate:status`
  - ✅ Success indicator: All migrations show "Yes" in Ran column
- [ ] Verify tables in database:
  ```bash
  mysql -u root -p
  USE schedulepro;
  SHOW TABLES;
  # Expected: 8 tables (companies, people, vehicles, equipment, bookings, booking_people, booking_vehicles, booking_equipment)
  exit;
  ```

### Phase 7: Start Development Server

- [ ] Run: `php spark serve`
- [ ] Verify server starts successfully
  - ✅ Success indicator: "CodeIgniter development server started on http://localhost:8080"
- [ ] Test in browser: Open `http://localhost:8080`
  - ✅ Expected: CodeIgniter welcome page or 404 (not an error)

### Phase 8: Create CORS Filter (Optional - for frontend integration)

- [ ] Create `app/Filters/Cors.php` (see backend PRD Section 13.0 for code)
- [ ] Register filter in `app/Config/Filters.php`
- [ ] Restart server: Stop server (Ctrl+C), run `php spark serve` again

### Backend Initialization Complete ✅

---

## 🎨 Frontend Initialization

### Phase 1: Create Vite + React Project

- [ ] Navigate to `schpro-frontend/` directory
- [ ] Run `npm create vite@latest . -- --template react`
  - ⏱️ Estimated time: 30 seconds
  - Answer prompts if any
  - ✅ Success indicator: `package.json` created, React files in `src/`

### Phase 2: Install Core Dependencies

- [ ] Run `npm install`
  - ⏱️ Estimated time: 1-2 minutes
  - ✅ Success indicator: `node_modules/` folder created
- [ ] Install Backbone.js and dependencies:
  - [ ] Run `npm install backbone underscore axios`
  - ✅ Success indicator: Dependencies added to `package.json`

### Phase 3: Install Tailwind CSS

- [ ] Run `npm install -D tailwindcss postcss autoprefixer`
- [ ] Initialize Tailwind: `npx tailwindcss init -p`
  - ✅ Success indicator: `tailwind.config.js` and `postcss.config.js` created

### Phase 4: Configure Tailwind CSS

- [ ] Edit `tailwind.config.js` - add content paths:
  ```javascript
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  ```
- [ ] Edit `src/index.css` - add Tailwind directives at top:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

**Reference:** `docs/frontend-initialization-guide.md` Section 1

### Phase 5: Configure Environment Variables

- [ ] Create `.env.example` file:
  ```env
  VITE_API_BASE_URL=http://localhost:8080/api
  VITE_DEV_MODE=true
  VITE_APP_NAME=SchedulePro
  ```
- [ ] Copy to `.env`: `cp .env.example .env`
- [ ] Add `.env` to `.gitignore`:
  ```gitignore
  # Environment variables
  .env
  .env.local
  .env.*.local
  ```

### Phase 6: Configure Vite

- [ ] Edit `vite.config.js` - add proxy configuration:
  ```javascript
  export default defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    optimizeDeps: {
      include: ['backbone', 'underscore', 'axios']
    }
  })
  ```

**Reference:** `docs/frontend-initialization-guide.md` Section 1, Step 5

### Phase 7: Create Project Structure

- [ ] Create directory structure:
  ```bash
  mkdir -p src/components/Auth
  mkdir -p src/components/BookingsList
  mkdir -p src/components/ResourceList
  mkdir -p src/components/BookingForm
  mkdir -p src/components/ResourceAssignment
  mkdir -p src/components/Dashboard
  mkdir -p src/components/common
  mkdir -p src/components/Layout
  mkdir -p src/models
  mkdir -p src/collections
  mkdir -p src/hooks
  mkdir -p src/router
  mkdir -p src/services
  mkdir -p src/views
  mkdir -p src/utils
  ```
- [ ] Verify all directories created: `ls -R src/`

**Reference:** `docs/frontend-implementation-plan.md` Phase 1.2

### Phase 8: Set Up Backbone.js Integration

- [ ] Create `src/services/api.js` (Axios instance with interceptors)
  - Copy code from `docs/frontend-initialization-guide.md` Section 2, Step 1
- [ ] Create `src/services/backboneSync.js` (Override Backbone.sync)
  - Copy code from `docs/frontend-initialization-guide.md` Section 2, Step 2
- [ ] Create `src/hooks/useBackboneModel.js`
  - Copy code from `docs/frontend-initialization-guide.md` Section 2, Step 3
- [ ] Create `src/hooks/useBackboneCollection.js`
  - Copy code from `docs/frontend-initialization-guide.md` Section 2, Step 3

**Reference:** `docs/frontend-initialization-guide.md` Section 2

### Phase 9: Update Main Entry Point

- [ ] Edit `src/main.jsx` - import Backbone and initialize:
  ```javascript
  import Backbone from 'backbone'
  import './services/backboneSync.js'

  Backbone.history.start({ pushState: true });
  ```

**Reference:** `docs/frontend-initialization-guide.md` Section 2, Step 4

### Phase 10: Start Development Server

- [ ] Run: `npm run dev`
- [ ] Verify server starts successfully
  - ✅ Success indicator: "VITE v5.0.0 ready in 500 ms"
  - ✅ Success indicator: "Local: http://localhost:5173/"
- [ ] Test in browser: Open `http://localhost:5173`
  - ✅ Expected: Vite + React welcome page

### Phase 11: Verify Integration

- [ ] Open browser console at `http://localhost:5173`
- [ ] Test environment variables:
  ```javascript
  console.log(import.meta.env.VITE_API_BASE_URL);
  // Expected: "http://localhost:8080/api"
  ```
- [ ] Test Backbone import:
  ```javascript
  import('backbone').then(Backbone => console.log(Backbone.VERSION));
  // Expected: "1.4.1" or similar
  ```

### Frontend Initialization Complete ✅

---

## 🧪 Integration Testing

### Test Backend API

- [ ] Backend server running at `http://localhost:8080`
- [ ] Open Postman or use curl
- [ ] Test health check endpoint (if created):
  ```bash
  curl http://localhost:8080/api/
  ```
  - ✅ Expected: JSON response (even if 404, server is working)

### Test Frontend-Backend Connection

- [ ] Backend server running at `http://localhost:8080`
- [ ] Frontend server running at `http://localhost:5173`
- [ ] Open browser console at `http://localhost:5173`
- [ ] Test API request via proxy:
  ```javascript
  fetch('/api/')
    .then(r => r.json())
    .then(data => console.log(data));
  ```
  - ✅ Expected: Response from backend (no CORS errors)

### Test Backbone.js Integration

- [ ] Create a test model file `src/models/TestModel.js`:
  ```javascript
  import Backbone from 'backbone';
  const TestModel = Backbone.Model.extend({ url: '/api/test' });
  export default TestModel;
  ```
- [ ] Import and test in browser console
  - ✅ Expected: Model uses Axios for requests (check Network tab)

### Integration Testing Complete ✅

---

## 📋 Post-Initialization Tasks

### Git Setup (Optional)

- [ ] Initialize git in project root (if not already):
  ```bash
  git init
  git add .
  git commit -m "Initial project setup"
  ```

### Documentation Updates

- [ ] Review `docs/backend-implementation-plan.md` - Phase 1 complete
- [ ] Review `docs/frontend-implementation-plan.md` - Phase 1 complete
- [ ] Mark Phase 1 tasks as complete in both plans

### Next Steps - Backend

Proceed to Phase 2 of backend implementation:
- [ ] Create JWT helper functions
- [ ] Create authentication filters
- [ ] Implement registration endpoint
- [ ] Implement login endpoint

**Reference:** `docs/backend-implementation-plan.md` Phase 2

### Next Steps - Frontend

Proceed to Phase 2 of frontend implementation:
- [ ] Create Backbone models (Person, Vehicle, Equipment, Booking)
- [ ] Create Backbone collections
- [ ] Create React-Backbone integration hooks
- [ ] Create Backbone router

**Reference:** `docs/frontend-implementation-plan.md` Phase 2

---

## ✅ Final Verification

### Backend Checklist
- [ ] CodeIgniter 4 project created
- [ ] JWT library installed
- [ ] `.env` file configured with database and JWT settings
- [ ] Database created (`schedulepro`)
- [ ] All 8 migrations created and run successfully
- [ ] Development server starts without errors
- [ ] CORS filter created (optional)

### Frontend Checklist
- [ ] Vite + React project created
- [ ] All dependencies installed (Backbone, Underscore, Axios, Tailwind)
- [ ] Tailwind CSS configured
- [ ] Environment variables configured (`.env` and `.env.example`)
- [ ] Vite configured with proxy
- [ ] Project structure created (all directories)
- [ ] Backbone.js integration files created
- [ ] Development server starts without errors
- [ ] Can access `http://localhost:5173` in browser

### Integration Checklist
- [ ] Both servers can run simultaneously
- [ ] Frontend can make requests to backend via proxy
- [ ] No CORS errors in browser console
- [ ] Backbone.js integration verified

---

## 🎯 You're Ready!

If all checkboxes above are complete, you're ready to start implementing features!

### Recommended Implementation Order:

1. **Backend Authentication** (Week 1-2)
   - Start with `docs/backend-implementation-plan.md` Phase 2

2. **Frontend Authentication** (Week 2)
   - Start with `docs/frontend-implementation-plan.md` Phase 3
   - (Complete Phase 2 models/collections in parallel)

3. **Backend + Frontend Resources** (Week 3-5)
   - Backend: People, Vehicles, Equipment (Phases 4-6)
   - Frontend: Resource management UI (Phase 6)

4. **Backend + Frontend Bookings** (Week 5-7)
   - Backend: Booking management + conflict detection (Phases 7-8)
   - Frontend: Booking forms + list view (Phases 7-8)

5. **Testing & Polish** (Week 8+)
   - Backend: Phase 9
   - Frontend: Phases 10-11

---

## 📞 Troubleshooting

If you encounter issues during initialization, refer to:
- Backend: `docs/prd/PRD-backend.md` Section 13.0
- Frontend: `docs/frontend-initialization-guide.md` Section 4 (Troubleshooting)

Common issues:
- **Port already in use**: Use different ports (`php spark serve --port=8081`, edit `vite.config.js`)
- **Database connection failed**: Check MySQL is running, verify credentials in `.env`
- **CORS errors**: Ensure proxy configured in `vite.config.js`, backend CORS filter created
- **Backbone not found**: Run `npm install`, check imports in files

---

*Checklist Version: 1.0*
*Created: January 2026*
*Total Estimated Setup Time: 1-2 hours*
