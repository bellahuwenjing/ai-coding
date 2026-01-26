# Frontend Implementation Plan
## SchedulePro React + Backbone.js App

---

## Overview

This plan outlines the implementation strategy for building the SchedulePro frontend application using React for UI and Backbone.js for data management and routing.

**Based on:** `docs/prd/PRD-frontend.md` v3.0 (Simplified MVP)

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
  │   ├── BookingsList/
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
- [ ] Create `src/models/Person.js` - **Unified Person model** with authentication and resource fields
  - Authentication fields: email (required), password (required), role (admin/member)
  - Resource fields: phone, skills, certifications, hourly_rate, is_deleted
  - Methods: isAdmin(), isMember(), isAssignable()
  - Validation for name, email, password
- [ ] Create `src/models/Vehicle.js` - Vehicle model with validation and `is_deleted` field
- [ ] Create `src/models/Equipment.js` - Equipment model with validation and `is_deleted` field
- [ ] Create `src/models/Booking.js` - Booking model with validation, getEntityIds() helper, and `is_deleted` field
- [ ] Create `src/models/Company.js` - Company model (if needed)

**Validation to implement:**
- Name required for all entity types
- Email and password required for Person (authentication)
- At least one entity required for bookings
- Start time before end time validation
- Email format validation for Person

**Note:**
- All models use soft delete (`is_deleted` flag) instead of hard deletion
- **User model merged into Person model** - Person serves both authentication and resource scheduling purposes

**Files to create:**
- `src/models/Person.js` (unified authentication & resource model)
- `src/models/Vehicle.js`
- `src/models/Equipment.js`
- `src/models/Booking.js`
- `src/models/Company.js`

---

### 2.2 Backbone Collections

**Tasks:**
- [ ] Create `src/collections/People.js` - People collection with:
  - `deleted()` filter
  - `assignable()` filter - returns only members (excludes admins)
  - `fetchAssignable()` method - fetch with assignable=true query param
- [ ] Create `src/collections/Vehicles.js` - Vehicles collection with `deleted()` filter
- [ ] Create `src/collections/Equipment.js` - Equipment collection with `deleted()` filter
- [ ] Create `src/collections/Bookings.js` - Bookings collection with:
  - `deleted()` filter
  - `forPerson(personId, includeDeleted)` method
  - `forVehicle(vehicleId, includeDeleted)` method
  - `forEquipment(equipmentId, includeDeleted)` method
  - `inDateRange(start, end, includeDeleted)` method
  - `findConflicts()` method (basic overlap checking)

**Note:** Users collection removed - authentication now uses People collection

**Files to create:**
- `src/collections/People.js` (with assignable filtering for resource assignment)
- `src/collections/Vehicles.js`
- `src/collections/Equipment.js`
- `src/collections/Bookings.js`

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
  - Provide login, logout, currentPerson (changed from currentUser)
  - Returns Person model with role field for authentication

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
  - `/bookings` → bookings list view
  - `/bookings/:id` → booking detail
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
- [ ] Load current person on app initialization (uses Person model)
- [ ] Implement role-based UI rendering (Admin vs Member)

**Note:** Authentication now uses Person model instead of separate User model. Login response includes person object with role field.

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
  - "Hide deleted" toggle filter
- [ ] Create `src/components/ResourceList/PeopleList.jsx`
  - Display people collection
  - Loading state
- [ ] Create `src/components/ResourceList/PersonItem.jsx`
  - Display person details
  - Visual distinction for deleted items (grayed out, strikethrough)
  - Edit/Delete buttons (Admin only)
  - Undelete button for deleted items (Admin only)
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
  - Password field (required on create, optional on update)
  - Role dropdown (admin/member)
  - Skills (multi-select or tags)
  - Certifications (multi-select or tags)
  - Hourly rate
- [ ] Create `src/components/ResourceList/VehicleForm.jsx`
  - Name, make, model, year
  - License plate, VIN
  - Capacity
- [ ] Create `src/components/ResourceList/EquipmentForm.jsx`
  - Name, serial number
  - Manufacturer, model
  - Condition dropdown
- [ ] Integrate forms with modals
- [ ] Implement create/update/delete (soft delete) operations
- [ ] Implement undelete operation (sets `is_deleted = 0`)

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
  - **Filter people to show only members (exclude admins)**
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
  - **Use People.assignable() or fetchAssignable() to exclude admins**

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
- [ ] Create `src/components/BookingForm/BookingForm.jsx`
  - Title, location inputs
  - Start/end time pickers
  - Notes textarea
  - ResourceAssignmentPanel integration
  - Basic conflict detection warning
  - Save/cancel buttons
  - Delete button (soft delete) with confirmation
  - Undelete button for deleted bookings
- [ ] Implement validation
- [ ] Implement basic conflict checking before save
- [ ] Handle create/update/delete (soft delete) operations
- [ ] Display success/error messages

**Files to create:**
- `src/components/BookingForm/BookingForm.jsx`

---

### 7.3 Conflict Detection (Basic)

**Tasks:**
- [ ] Create `src/utils/conflictDetection.js`
  - Basic findConflicts() function
  - Check simple time overlap for all entity types
  - Return list of conflicting bookings
- [ ] Integrate with BookingForm
- [ ] Display basic conflict warnings
- [ ] Allow user to proceed with booking despite conflicts

**Files to create:**
- `src/utils/conflictDetection.js`

**Note:** This is a simplified implementation for MVP. Detailed conflict resolution behavior will be defined after basic features are established.

---

## Phase 8: Bookings List View (Week 8-9)

### 8.1 Bookings List Components

**Tasks:**
- [ ] Create `src/components/BookingsList/BookingsList.jsx`
  - Table/list container
  - Column headers (Title, Location, Date/Time, Entities, Actions)
  - Sortable columns
  - Loading state
  - Empty state
- [ ] Create `src/components/BookingsList/BookingRow.jsx`
  - Display booking details in row format
  - Entity icons/badges (people, vehicles, equipment)
  - Date and time display
  - Edit/Delete buttons (Admin only)
  - Visual distinction for deleted bookings
  - Undelete button for deleted bookings (Admin only)
  - Click handler to view details
- [ ] Create `src/components/BookingsList/BookingFilters.jsx`
  - Date range picker
  - Search input (search by title, location)
  - Entity type filters (People, Vehicles, Equipment)
  - "Hide deleted" toggle
  - Clear filters button
- [ ] Create `src/components/BookingsList/BookingDetailsModal.jsx`
  - Full booking information display
  - List of assigned entities
  - Edit button (opens BookingForm)
  - Close button

**Files to create:**
- `src/components/BookingsList/BookingsList.jsx`
- `src/components/BookingsList/BookingRow.jsx`
- `src/components/BookingsList/BookingFilters.jsx`
- `src/components/BookingsList/BookingDetailsModal.jsx`

---

### 8.2 Bookings Page

**Tasks:**
- [ ] Create `src/views/BookingsPage.jsx`
  - BookingsList integration
  - BookingFilters integration
  - Fetch bookings collection on mount
  - Handle search/filter changes
  - Handle sorting changes
  - Handle booking click → open BookingDetailsModal
  - "New Booking" button (Admin only) → open BookingForm modal
  - Pagination (if needed)
- [ ] Implement client-side filtering and sorting
- [ ] Handle deleted bookings visibility toggle

**Files to create:**
- `src/views/BookingsPage.jsx`

**Note:** Calendar view with drag-and-drop rescheduling is planned for future enhancement. For now, bookings are rescheduled by editing the booking times in the form.

---

## Phase 9: Settings & Member View (Week 10)

### 9.1 Settings Page

**Tasks:**
- [ ] Create `src/views/SettingsPage.jsx`
  - User profile section
  - Company settings (Admin only)
  - Password change
- [ ] Implement settings save functionality

**Files to create:**
- `src/views/SettingsPage.jsx`

---

### 9.2 Member-Specific Features

**Tasks:**
- [ ] Implement member view restrictions
  - Hide Create/Edit/Delete/Undelete buttons
  - Read-only bookings list
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
  - Soft delete each type (sets `is_deleted = 1`)
  - Verify deleted items show visual distinction
  - Undelete each type (sets `is_deleted = 0`)
  - Verify "Hide deleted" toggle works
- [ ] Test booking creation
  - Single entity assignment
  - Multiple entities assignment
- [ ] Test booking soft delete
  - Delete booking (soft delete)
  - Verify deleted booking visibility
  - Undelete booking
- [ ] Test basic conflict detection
  - Create overlapping bookings
  - Verify basic warning display
  - Verify user can proceed despite conflicts
- [ ] Test bookings list view
  - Search and filter bookings
  - Sort by columns
  - Click to view details
  - Edit booking
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
- [ ] Test table/list keyboard navigation

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
- [ ] Admin can edit and soft delete entities
- [ ] Admin can undelete entities
- [ ] Deleted entities show visual distinction
- [ ] "Hide deleted" toggle works correctly
- [ ] Admin can create bookings with multiple entity types
- [ ] Basic conflict detection works correctly
- [ ] Bookings list displays all bookings correctly
- [ ] Bookings can be searched, filtered, and sorted
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
| 8 | Week 8 | Bookings list view (simplified) |
| 9 | Week 9 | Settings & member view |
| 10 | Week 10-11 | Integration & testing |
| 11 | Week 11-12 | Polish & deployment |

**Total Estimated Time:** 11-12 weeks (reduced from 12-13 weeks due to simplified MVP scope)

---

## Notes

- This plan assumes a single developer working full-time
- Timeline may vary based on team size and experience
- Phases can be parallelized if multiple developers are available
- Regular testing should be done throughout, not just in Phase 10
- Consider using a task management tool (Jira, Trello, GitHub Projects) to track progress

## Simplifications for MVP

This implementation plan reflects a simplified MVP scope compared to the original PRD:

1. **No drag-and-drop rescheduling** - Bookings are rescheduled by editing time fields in the form
2. **No resource availability management** - Availability tracking removed for initial launch
3. **No recurring bookings** - Each booking is a single instance
4. **Bookings list instead of calendar** - Table/list view instead of visual calendar (calendar planned for future)
5. **Basic conflict detection** - Simple time overlap checking; detailed resolution planned for later
6. **Soft delete pattern** - All entities use `is_deleted` flag with undelete capability

These simplifications reduce development time from 12-13 weeks to 11-12 weeks while establishing core functionality that can be enhanced in future iterations.

---

*Plan Version: 2.0 (Simplified MVP)*
*Created: January 2026*
*Updated: January 2026*
*Based on: PRD-frontend.md v3.0*
