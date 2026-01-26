# Frontend Implementation Plan
## SchedulePro React + Backbone.js App

---

## Overview

This plan outlines the implementation strategy for building the SchedulePro frontend application using React for UI and Backbone.js for data management and routing.

**Based on:** `docs/prd/PRD-frontend.md` v2.0

---

## Phase 1: Project Setup & Infrastructure (Week 1)

### 1.1 Initialize Project

**Tasks:**
- [ ] Create Vite project with React template
- [ ] Install dependencies:
  - React 18+
  - Backbone.js
  - Underscore.js (Backbone dependency)
  - Axios
  - Tailwind CSS
- [ ] Configure Vite for Backbone.js compatibility
- [ ] Set up Tailwind CSS configuration
- [ ] Create `.env.example` file with required variables
- [ ] Initialize git repository (if not already done)

**Files to create:**
- `package.json`
- `vite.config.js`
- `tailwind.config.js`
- `.env.example`
- `.gitignore`

---

### 1.2 Project Structure

**Tasks:**
- [ ] Create folder structure as per PRD architecture:
  ```
  src/
  ├── components/
  │   ├── Auth/
  │   ├── Calendar/
  │   ├── ResourceList/
  │   ├── BookingForm/
  │   ├── ResourceAssignment/
  │   ├── Dashboard/
  │   └── common/
  ├── models/
  ├── collections/
  ├── hooks/
  ├── router/
  ├── services/
  ├── views/
  └── utils/
  ```

**Files to create:**
- Create placeholder `index.js` files in each directory
- `src/utils/constants.js` - Define app constants
- `src/utils/dateUtils.js` - Date formatting utilities

---

### 1.3 API Integration Setup

**Tasks:**
- [ ] Create `src/services/api.js` - Axios instance with interceptors
- [ ] Create `src/services/backboneSync.js` - Override Backbone.sync
- [ ] Add request interceptor for auth token
- [ ] Add response interceptor for 401 handling
- [ ] Test API connection with a simple health check

**Files to create:**
- `src/services/api.js`
- `src/services/backboneSync.js`

---

## Phase 2: Backbone Foundation (Week 1-2)

### 2.1 Backbone Models

**Tasks:**
- [ ] Create `src/models/User.js` - User model with isAdmin() method
- [ ] Create `src/models/Person.js` - Person model with validation
- [ ] Create `src/models/Vehicle.js` - Vehicle model with validation
- [ ] Create `src/models/Equipment.js` - Equipment model with validation
- [ ] Create `src/models/Booking.js` - Booking model with validation and getEntityIds() helper
- [ ] Create `src/models/Company.js` - Company model (if needed)

**Validation to implement:**
- Name required for all entity types
- At least one entity required for bookings
- Start time before end time validation
- Email format validation for Person

**Files to create:**
- `src/models/User.js`
- `src/models/Person.js`
- `src/models/Vehicle.js`
- `src/models/Equipment.js`
- `src/models/Booking.js`
- `src/models/Company.js`

---

### 2.2 Backbone Collections

**Tasks:**
- [ ] Create `src/collections/People.js` - People collection with active() filter
- [ ] Create `src/collections/Vehicles.js` - Vehicles collection with active() filter
- [ ] Create `src/collections/Equipment.js` - Equipment collection with active() filter
- [ ] Create `src/collections/Bookings.js` - Bookings collection with:
  - `forPerson(personId)` method
  - `forVehicle(vehicleId)` method
  - `forEquipment(equipmentId)` method
  - `inDateRange(start, end)` method
  - `findConflicts()` method
- [ ] Create `src/collections/Users.js` - Users collection (if needed)

**Files to create:**
- `src/collections/People.js`
- `src/collections/Vehicles.js`
- `src/collections/Equipment.js`
- `src/collections/Bookings.js`
- `src/collections/Users.js`

---

### 2.3 React-Backbone Integration Hooks

**Tasks:**
- [ ] Create `src/hooks/useBackboneModel.js` - Hook for Backbone models
  - Listen to change, sync, error, request events
  - Return attributes, isSyncing, error, save, destroy
- [ ] Create `src/hooks/useBackboneCollection.js` - Hook for Backbone collections
  - Listen to add, remove, reset, change, sync, error, request events
  - Return models, isFetching, error, fetch
- [ ] Create `src/hooks/useAuth.js` - Authentication hook
  - Manage auth token
  - Provide login, logout, currentUser

**Files to create:**
- `src/hooks/useBackboneModel.js`
- `src/hooks/useBackboneCollection.js`
- `src/hooks/useAuth.js`

---

### 2.4 Backbone Router

**Tasks:**
- [ ] Create `src/router/AppRouter.js` - Backbone router with routes:
  - `/` → dashboard
  - `/dashboard` → dashboard
  - `/calendar` → calendar (week view)
  - `/calendar/:view` → calendar (specific view)
  - `/resources` → resources list
  - `/resources/:id` → resource detail
  - `/settings` → settings
  - `/login` → login
- [ ] Create `src/hooks/useRouter.js` - Hook to integrate with React
- [ ] Implement navigate() function

**Files to create:**
- `src/router/AppRouter.js`
- `src/hooks/useRouter.js`

---

## Phase 3: Authentication (Week 2)

### 3.1 Login System

**Tasks:**
- [ ] Create `src/components/Auth/LoginForm.jsx` - Login form component
  - Email and password inputs
  - Form validation
  - Submit handler
  - Error display
- [ ] Create `src/components/Auth/ProtectedRoute.jsx` - Route guard component
  - Check for auth token
  - Redirect to login if unauthenticated
- [ ] Create `src/views/LoginPage.jsx` - Login page wrapper
- [ ] Implement login API call
- [ ] Store token in localStorage
- [ ] Test login flow

**Files to create:**
- `src/components/Auth/LoginForm.jsx`
- `src/components/Auth/ProtectedRoute.jsx`
- `src/views/LoginPage.jsx`

---

### 3.2 Session Management

**Tasks:**
- [ ] Implement auto-logout on token expiration
- [ ] Add logout functionality
- [ ] Load current user on app initialization
- [ ] Implement role-based UI rendering (Admin vs Member)

---

## Phase 4: Common Components (Week 2-3)

### 4.1 UI Components Library

**Tasks:**
- [ ] Create `src/components/common/Button.jsx`
  - Variants: primary, secondary, danger
  - Sizes: sm, md, lg
  - Disabled state
- [ ] Create `src/components/common/Modal.jsx`
  - Backdrop
  - Close button
  - Focus trap
- [ ] Create `src/components/common/Input.jsx`
  - Label
  - Error message display
  - Different input types
- [ ] Create `src/components/common/Select.jsx`
  - Dropdown with options
  - Placeholder support
- [ ] Create `src/components/common/Alert.jsx`
  - Types: success, error, warning, info
  - Dismissible
- [ ] Create `src/components/common/Spinner.jsx`
  - Size variations
- [ ] Create `src/components/common/Badge.jsx`
  - Color variants

**Files to create:**
- `src/components/common/Button.jsx`
- `src/components/common/Modal.jsx`
- `src/components/common/Input.jsx`
- `src/components/common/Select.jsx`
- `src/components/common/Alert.jsx`
- `src/components/common/Spinner.jsx`
- `src/components/common/Badge.jsx`

---

### 4.2 Layout Components

**Tasks:**
- [ ] Create `src/components/Layout/Sidebar.jsx` - Navigation sidebar
- [ ] Create `src/components/Layout/Header.jsx` - Top header with user menu
- [ ] Create `src/components/Layout/MainLayout.jsx` - Main app layout wrapper

**Files to create:**
- `src/components/Layout/Sidebar.jsx`
- `src/components/Layout/Header.jsx`
- `src/components/Layout/MainLayout.jsx`

---

## Phase 5: Dashboard (Week 3)

### 5.1 Dashboard Components

**Tasks:**
- [ ] Create `src/components/Dashboard/StatsCard.jsx`
  - Icon
  - Title
  - Value
  - Trend indicator (optional)
- [ ] Create `src/components/Dashboard/TodayBookings.jsx`
  - List of today's bookings
  - Time display
  - Entity icons
- [ ] Create `src/components/Dashboard/RecentActivity.jsx`
  - Activity feed
  - Timestamps
- [ ] Create `src/views/DashboardPage.jsx` - Main dashboard view
  - 4 stat cards (Total resources, Scheduled today, Utilization, Conflicts)
  - Today's bookings section
  - Recent activity section
  - Quick action buttons

**Files to create:**
- `src/components/Dashboard/StatsCard.jsx`
- `src/components/Dashboard/TodayBookings.jsx`
- `src/components/Dashboard/RecentActivity.jsx`
- `src/views/DashboardPage.jsx`

---

### 5.2 Dashboard Data Loading

**Tasks:**
- [ ] Fetch today's bookings
- [ ] Calculate stats (total resources, utilization)
- [ ] Fetch recent activity from API
- [ ] Handle loading states
- [ ] Handle error states

---

## Phase 6: Resource Management (Week 4-5)

### 6.1 Resource List Components

**Tasks:**
- [ ] Create `src/components/ResourceList/ResourceTabs.jsx`
  - Tabs: People | Vehicles | Equipment
  - Active tab state
- [ ] Create `src/components/ResourceList/PeopleFilters.jsx`
  - Search input
  - Active/inactive filter
- [ ] Create `src/components/ResourceList/PeopleList.jsx`
  - Display people collection
  - Loading state
- [ ] Create `src/components/ResourceList/PersonItem.jsx`
  - Display person details
  - Edit/Delete buttons (Admin only)
  - Skills and certifications display
- [ ] Create similar components for Vehicles and Equipment:
  - `VehiclesFilters.jsx`, `VehiclesList.jsx`, `VehicleItem.jsx`
  - `EquipmentFilters.jsx`, `EquipmentList.jsx`, `EquipmentItem.jsx`

**Files to create:**
- `src/components/ResourceList/ResourceTabs.jsx`
- `src/components/ResourceList/PeopleFilters.jsx`
- `src/components/ResourceList/PeopleList.jsx`
- `src/components/ResourceList/PersonItem.jsx`
- `src/components/ResourceList/VehiclesFilters.jsx`
- `src/components/ResourceList/VehiclesList.jsx`
- `src/components/ResourceList/VehicleItem.jsx`
- `src/components/ResourceList/EquipmentFilters.jsx`
- `src/components/ResourceList/EquipmentList.jsx`
- `src/components/ResourceList/EquipmentItem.jsx`

---

### 6.2 Resource Forms

**Tasks:**
- [ ] Create `src/components/ResourceList/PersonForm.jsx`
  - Name, email, phone inputs
  - Skills (multi-select or tags)
  - Certifications (multi-select or tags)
  - Hourly rate
  - Availability schedule
  - Is active toggle
- [ ] Create `src/components/ResourceList/VehicleForm.jsx`
  - Name, make, model, year
  - License plate, VIN
  - Capacity
  - Availability schedule
  - Is active toggle
- [ ] Create `src/components/ResourceList/EquipmentForm.jsx`
  - Name, serial number
  - Manufacturer, model
  - Condition dropdown
  - Maintenance dates
  - Availability schedule
  - Is active toggle
- [ ] Integrate forms with modals
- [ ] Implement create/update/delete operations

**Files to create:**
- `src/components/ResourceList/PersonForm.jsx`
- `src/components/ResourceList/VehicleForm.jsx`
- `src/components/ResourceList/EquipmentForm.jsx`

---

### 6.3 Resources Page

**Tasks:**
- [ ] Create `src/views/ResourcesPage.jsx`
  - Resource tabs integration
  - Add button (changes based on active tab)
  - Filter integration
  - List display
  - Handle tab switching
- [ ] Implement search/filter logic
- [ ] Fetch collections on mount
- [ ] Handle permissions (Admin only)

**Files to create:**
- `src/views/ResourcesPage.jsx`

---

## Phase 7: Booking Management (Week 6-7)

### 7.1 Resource Assignment Panel

**Tasks:**
- [ ] Create `src/components/ResourceAssignment/EntityTabs.jsx`
  - Tabs: People | Vehicles | Equipment
- [ ] Create `src/components/ResourceAssignment/EntityList.jsx`
  - Search input
  - Scrollable list
- [ ] Create `src/components/ResourceAssignment/EntityListItem.jsx`
  - Checkbox or click handler
  - Entity details display
- [ ] Create `src/components/ResourceAssignment/BookingContextCard.jsx`
  - Booking title, location
  - Date and time
- [ ] Create `src/components/ResourceAssignment/AssignedEntityChip.jsx`
  - Entity icon and name
  - Remove button (✕)
- [ ] Create `src/components/ResourceAssignment/ResourceAssignmentPanel.jsx`
  - Left panel: Entity selection with tabs
  - Right panel: Booking context with assigned entities
  - Add/remove handlers

**Files to create:**
- `src/components/ResourceAssignment/EntityTabs.jsx`
- `src/components/ResourceAssignment/EntityList.jsx`
- `src/components/ResourceAssignment/EntityListItem.jsx`
- `src/components/ResourceAssignment/BookingContextCard.jsx`
- `src/components/ResourceAssignment/AssignedEntityChip.jsx`
- `src/components/ResourceAssignment/ResourceAssignmentPanel.jsx`

---

### 7.2 Booking Form

**Tasks:**
- [ ] Create `src/components/BookingForm/RecurrenceSelector.jsx`
  - None | Daily | Weekly | Monthly options
- [ ] Create `src/components/BookingForm/BookingForm.jsx`
  - Title, location inputs
  - Start/end time pickers
  - Notes textarea
  - Recurrence selector
  - ResourceAssignmentPanel integration
  - Conflict detection warning
  - Save/cancel buttons
- [ ] Implement validation
- [ ] Implement conflict checking before save
- [ ] Handle create/update operations
- [ ] Display success/error messages

**Files to create:**
- `src/components/BookingForm/RecurrenceSelector.jsx`
- `src/components/BookingForm/BookingForm.jsx`

---

### 7.3 Conflict Detection

**Tasks:**
- [ ] Create `src/utils/conflictDetection.js`
  - findConflicts() function
  - Check overlap for all entity types
- [ ] Integrate with BookingForm
- [ ] Display conflict warnings
- [ ] Allow override with confirmation (if applicable)

**Files to create:**
- `src/utils/conflictDetection.js`

---

## Phase 8: Calendar Views (Week 8-9)

### 8.1 Calendar Components

**Tasks:**
- [ ] Create `src/components/Calendar/CalendarView.jsx`
  - View toggle (Day | Week | Month)
  - Date navigation (prev/next)
  - Filter controls
  - Render appropriate view component
- [ ] Create `src/components/Calendar/DayView.jsx`
  - 24-hour timeline
  - Booking blocks
  - Drag-and-drop zones
- [ ] Create `src/components/Calendar/WeekView.jsx`
  - 7-day grid
  - Time slots
  - Booking blocks
- [ ] Create `src/components/Calendar/MonthView.jsx`
  - Calendar grid
  - Day cells with booking indicators
- [ ] Create `src/components/Calendar/BookingBlock.jsx`
  - Entity icons
  - Booking title
  - Time display
  - Click handler
  - Drag handlers (Admin only)

**Files to create:**
- `src/components/Calendar/CalendarView.jsx`
- `src/components/Calendar/DayView.jsx`
- `src/components/Calendar/WeekView.jsx`
- `src/components/Calendar/MonthView.jsx`
- `src/components/Calendar/BookingBlock.jsx`

---

### 8.2 Drag-and-Drop (Admin Only)

**Tasks:**
- [ ] Implement HTML5 drag-and-drop or use react-dnd
- [ ] Drag start handler
- [ ] Drop zone validation
- [ ] Conflict check on drop
- [ ] Reschedule confirmation modal
- [ ] Update booking on confirm

---

### 8.3 Calendar Page

**Tasks:**
- [ ] Create `src/views/CalendarPage.jsx`
  - CalendarView integration
  - Fetch bookings for date range
  - Fetch all entity collections
  - Handle view changes
  - Handle date navigation
  - Handle filters
  - Handle booking click → open BookingForm modal

**Files to create:**
- `src/views/CalendarPage.jsx`

---

## Phase 9: Settings & Member View (Week 10)

### 9.1 Settings Page

**Tasks:**
- [ ] Create `src/views/SettingsPage.jsx`
  - User profile section
  - Company settings (Admin only)
  - Availability settings (if linked to resource)
  - Password change
- [ ] Implement settings save functionality

**Files to create:**
- `src/views/SettingsPage.jsx`

---

### 9.2 Member-Specific Features

**Tasks:**
- [ ] Implement member view restrictions
  - Hide Create/Edit/Delete buttons
  - Read-only calendar
  - Filter to show only assigned bookings
- [ ] Create member dashboard view (optional)
- [ ] Test member role UI

---

## Phase 10: Integration & Testing (Week 11-12)

### 10.1 Main App Integration

**Tasks:**
- [ ] Create `src/App.jsx`
  - Router integration
  - Layout wrapper
  - Route handling
  - Page rendering based on current route
- [ ] Create `src/main.jsx`
  - Initialize Backbone sync override
  - Start Backbone history
  - Render React app
- [ ] Test routing between all pages
- [ ] Test authentication flow
- [ ] Test role-based access

**Files to create:**
- `src/App.jsx`
- `src/main.jsx`

---

### 10.2 End-to-End Testing

**Tasks:**
- [ ] Test login → dashboard flow
- [ ] Test resource CRUD operations
  - Create person, vehicle, equipment
  - Edit each type
  - Delete each type
- [ ] Test booking creation
  - Single entity assignment
  - Multiple entities assignment
  - Recurrence
- [ ] Test conflict detection
  - Create overlapping bookings
  - Verify warning display
- [ ] Test calendar views
  - Day view navigation
  - Week view navigation
  - Month view navigation
- [ ] Test drag-and-drop (if implemented)
- [ ] Test member view restrictions
- [ ] Cross-browser testing

---

### 10.3 Performance Optimization

**Tasks:**
- [ ] Implement lazy loading for routes
- [ ] Optimize collection fetching (pagination if needed)
- [ ] Memoize expensive computations
- [ ] Code splitting
- [ ] Image optimization

---

### 10.4 Accessibility

**Tasks:**
- [ ] Add keyboard navigation
- [ ] Add ARIA labels
- [ ] Test with screen reader
- [ ] Ensure color contrast ratios
- [ ] Focus management in modals
- [ ] Test calendar keyboard navigation

---

## Phase 11: Polish & Deployment (Week 12-13)

### 11.1 UI Polish

**Tasks:**
- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Add error boundaries
- [ ] Improve error messages
- [ ] Add success notifications
- [ ] Polish animations and transitions
- [ ] Mobile responsiveness testing
- [ ] Final design review

---

### 11.2 Build & Deployment

**Tasks:**
- [ ] Create production build
- [ ] Test production build locally
- [ ] Set up environment variables for production
- [ ] Deploy to hosting (Vercel/Netlify)
- [ ] Configure custom domain (if applicable)
- [ ] Test deployed application
- [ ] Monitor for errors

---

## Verification Checklist

### Core Functionality
- [ ] User can log in with email/password
- [ ] Admin can create people, vehicles, and equipment
- [ ] Admin can edit and delete entities
- [ ] Admin can create bookings with multiple entity types
- [ ] Conflict detection works correctly
- [ ] Calendar displays bookings correctly in all views
- [ ] Drag-and-drop rescheduling works (Admin)
- [ ] Member users have read-only access

### Data Management
- [ ] Backbone models sync with API correctly
- [ ] Collections update reactively
- [ ] React components re-render on Backbone changes
- [ ] Form validation works for all entity types
- [ ] Error handling displays user-friendly messages

### UI/UX
- [ ] All pages are mobile-responsive
- [ ] Navigation works correctly
- [ ] Modals open/close properly
- [ ] Filters and search work
- [ ] Color coding is consistent
- [ ] Icons display correctly

### Performance
- [ ] Initial page load < 3 seconds
- [ ] No unnecessary re-renders
- [ ] Collections don't fetch on every navigation
- [ ] Images are optimized

### Security
- [ ] Auth token is required for protected routes
- [ ] 401 responses redirect to login
- [ ] Admin-only features are hidden from members
- [ ] XSS protection in place

---

## Dependencies Summary

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "backbone": "^1.4.1",
    "underscore": "^1.13.6",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| 1 | Week 1 | Project setup, infrastructure |
| 2 | Week 1-2 | Backbone models, collections, hooks |
| 3 | Week 2 | Authentication |
| 4 | Week 2-3 | Common components |
| 5 | Week 3 | Dashboard |
| 6 | Week 4-5 | Resource management |
| 7 | Week 6-7 | Booking management |
| 8 | Week 8-9 | Calendar views |
| 9 | Week 10 | Settings & member view |
| 10 | Week 11-12 | Integration & testing |
| 11 | Week 12-13 | Polish & deployment |

**Total Estimated Time:** 12-13 weeks

---

## Notes

- This plan assumes a single developer working full-time
- Timeline may vary based on team size and experience
- Phases can be parallelized if multiple developers are available
- Regular testing should be done throughout, not just in Phase 10
- Consider using a task management tool (Jira, Trello, GitHub Projects) to track progress

---

*Plan Version: 1.0*
*Created: January 2026*
*Based on: PRD-frontend.md v2.0*
