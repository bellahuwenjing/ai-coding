# PRD: Frontend Application
## SchedulePro - React + Backbone.js Scheduling App

---

## 1. Overview

### 1.1 Product Summary

SchedulePro is a comprehensive resource scheduling application designed to help operations managers coordinate people, vehicles, and equipment across their organization. The application solves the common problem of managing multiple resource types separately through spreadsheets, disconnected calendars, and manual coordination that leads to double-bookings, poor utilization, and communication breakdowns.

**Core Purpose:**
Enable companies to schedule, track, and optimize the allocation of their workforce, fleet vehicles, and equipment through a unified, real-time calendar system that prevents conflicts and improves resource utilization.

**Key Capabilities:**
- **Unified Resource Management** - Manage people (with skills/certifications), vehicles (with capacity/maintenance), and equipment (with condition tracking) from a single platform
- **Visual Scheduling** - Drag-and-drop booking creation with real-time conflict detection across all resource types
- **Multi-Resource Bookings** - Assign multiple people, vehicles, and equipment to a single booking/job
- **Conflict Prevention** - Automatic detection and warnings when attempting to double-book any resource
- **Role-Based Access** - Admin users manage the system; Member users view their assigned bookings
- **Real-Time Sync** - All users see updates immediately when bookings are created, modified, or deleted
- **Recurring Bookings** - Support for daily, weekly, and monthly recurring assignments
- **Mobile Access** - Responsive design for field teams to view schedules on mobile devices

**Target Industries:** Construction, logistics, field services, healthcare, manufacturing, and rental companies with 50-500 employees that need to coordinate multiple resource types simultaneously.

### 1.2 Target Users

**Primary Users - Admin (Operations Managers):**
- Create and manage resource inventory (people, vehicles, equipment)
- Create, edit, and delete bookings
- Assign resources to jobs/bookings
- Monitor resource utilization and conflicts
- Manage team member accounts
- Configure company settings

**Secondary Users - Member (Field Workers, Coordinators):**
- View assigned bookings on calendar
- See their schedule for upcoming days/weeks
- Update personal availability (if linked to a person resource)
- View details of bookings they're assigned to
- Access schedule from mobile devices while in the field

### 1.3 User Problems Solved

**Before SchedulePro:**
- ❌ Using separate spreadsheets for people, vehicles, and equipment schedules
- ❌ Double-bookings discovered too late (when resources arrive on-site)
- ❌ No visibility into what resources are available at a given time
- ❌ Manual phone calls/texts to check availability before assigning
- ❌ Can't see full picture of a job's resource requirements
- ❌ Poor resource utilization (some resources overbooked, others idle)
- ❌ Last-minute scrambling when conflicts are discovered

**After SchedulePro:**
- ✅ Single calendar view showing all resource types together
- ✅ Instant conflict detection when creating bookings
- ✅ Real-time availability visibility for all resources
- ✅ Drag-and-drop assignment with automatic validation
- ✅ Complete job view showing all assigned people, vehicles, and equipment
- ✅ Data-driven utilization insights
- ✅ Proactive conflict prevention

---

## 2. User Stories & Workflows

### 2.1 Admin User Stories

**As an Admin, I want to:**

1. **Manage Resource Inventory**
   - Add new people to the system with their skills, certifications, and availability
   - Add vehicles with license plates, capacity, and maintenance schedules
   - Add equipment with serial numbers, condition status, and maintenance dates
   - Edit resource details when information changes
   - Mark resources as inactive when they're no longer available (without deleting history)
   - Search and filter resources by type, status, or name

2. **Create and Manage Bookings**
   - Create a booking by selecting date/time and assigning resources
   - Assign multiple people, vehicles, and equipment to a single booking
   - See instant warnings if any resource is already booked during that time
   - Add booking details: title, location, notes
   - Create recurring bookings (daily, weekly, monthly)
   - Edit existing bookings to change time or assigned resources
   - Delete bookings when jobs are cancelled

3. **View and Analyze Schedules**
   - View calendar in Day, Week, or Month views
   - Filter calendar by resource type (show only people, only vehicles, etc.)
   - See color-coded booking blocks for easy visual scanning
   - Drag-and-drop bookings to reschedule
   - View dashboard with key metrics (utilization, conflicts, today's bookings)
   - See which resources are most/least utilized

4. **Prevent Conflicts**
   - Get automatic warnings when attempting to double-book a resource
   - See which bookings conflict when creating a new booking
   - View conflicts on the calendar with visual indicators
   - Resolve conflicts by reassigning resources or changing times

### 2.2 Member User Stories

**As a Member, I want to:**

1. **View My Schedule**
   - See all bookings I'm assigned to on a calendar
   - View my schedule for today, this week, or this month
   - Access my schedule from my mobile phone while in the field
   - See details of each booking: time, location, notes, other assigned resources

2. **Stay Informed**
   - Know what resources (vehicles, equipment) are assigned to my bookings
   - See if I'm working with other team members on a job
   - View upcoming bookings to plan my day/week

3. **Manage Availability (Optional)**
   - Update my working hours if I'm linked to a person resource
   - Mark days I'm unavailable (vacation, sick leave)

### 2.3 Key User Workflows

#### Workflow 1: Create a New Booking (Admin)

1. Admin navigates to Calendar or Dashboard
2. Clicks "Create Booking" button
3. Booking form modal opens
4. Admin enters:
   - Title: "Site Visit - 123 Oak Street"
   - Location: "123 Oak Street, Springfield"
   - Date: January 25, 2026
   - Start time: 9:00 AM
   - End time: 12:00 PM
   - Notes: "Bring ladder and electrical tools"
5. Admin switches to "People" tab in resource assignment panel
6. Searches for "John" and clicks to assign "John Smith"
7. Switches to "Vehicles" tab
8. Clicks to assign "Ford F-150 #2"
9. Switches to "Equipment" tab
10. Clicks to assign "Excavator #1"
11. System checks for conflicts automatically
12. No conflicts found → "Save Booking" button is enabled
13. Admin clicks "Save Booking"
14. Success message appears
15. Calendar updates with new booking block
16. All users see the new booking immediately

**Conflict Scenario:**
- At step 11, if "John Smith" is already booked 10:00 AM - 2:00 PM
- System displays warning: "⚠️ Conflict: John Smith is already booked for 'Equipment Maintenance' from 10:00 AM - 2:00 PM"
- Admin can either:
  - Remove John and assign someone else
  - Change the booking time to avoid conflict
  - Override conflict with confirmation (if permitted)

#### Workflow 2: Reschedule a Booking (Admin - Drag and Drop)

1. Admin views Week calendar
2. Sees booking "Site Visit" on Monday 9:00 AM
3. Drags the booking block to Tuesday 2:00 PM
4. System validates the new time for all assigned resources
5. If no conflicts: Confirmation modal appears "Reschedule this booking to Tuesday 2:00 PM?"
6. Admin clicks "Confirm"
7. Booking updates to new time
8. All assigned members see updated schedule

#### Workflow 3: View Schedule (Member)

1. Member logs in
2. Dashboard shows today's bookings assigned to them
3. Member clicks "Calendar" in sidebar
4. Week view shows all their bookings for the week
5. Member clicks on a booking block
6. Modal shows booking details:
   - Title: "Site Visit - 123 Oak Street"
   - Location: "123 Oak Street, Springfield"
   - Time: Monday 9:00 AM - 12:00 PM
   - Notes: "Bring ladder and electrical tools"
   - Assigned people: John Smith (me), Jane Doe
   - Assigned vehicles: Ford F-150 #2
   - Assigned equipment: Excavator #1
7. Member closes modal
8. Member switches to Day view to see today's schedule in detail

#### Workflow 4: Manage Resources (Admin)

1. Admin navigates to Resources page
2. Sees three tabs: People | Vehicles | Equipment
3. Clicks "People" tab (default)
4. Sees list of all people with:
   - Name, email, skills, certifications
   - Active/Inactive status
   - Edit and Delete buttons
5. Clicks "+ Add Person" button
6. Form modal opens
7. Admin fills in:
   - Name: "Sarah Chen"
   - Email: "sarah@company.com"
   - Phone: "+1-555-0123"
   - Skills: "Plumbing, HVAC"
   - Certifications: "Journeyman Plumber, OSHA 30"
   - Hourly Rate: $45.00
   - Availability: Monday-Friday 8:00 AM - 5:00 PM
8. Clicks "Save"
9. Sarah Chen appears in the people list
10. Sarah is now available for assignment to bookings

---

## 3. Functional Requirements & Behavior

### 3.1 Resource Management Behavior

**Creating Resources:**
- Form validation occurs in real-time (name required before save)
- Duplicate detection warns if similar name exists (optional)
- Default availability is set to Monday-Friday 9:00 AM - 5:00 PM
- New resources are automatically set to "Active" status
- Changes are saved immediately to the backend
- Success notification appears after save
- Resource immediately appears in assignment lists

**Editing Resources:**
- Editing opens a pre-filled form modal
- Changes to availability affect future bookings only (existing bookings unchanged)
- Validation prevents saving invalid data (e.g., empty name)
- "Cancel" button discards changes
- Changes sync in real-time to other logged-in users

**Deleting Resources:**
- Confirmation modal appears: "Are you sure you want to delete [Resource Name]? This action cannot be undone."
- If resource has future bookings, additional warning: "This resource is assigned to X upcoming bookings. Delete anyway?"
- Deleting removes resource from all future bookings
- Historical bookings retain the resource name for record-keeping
- Delete is immediate and cannot be undone

**Deactivating vs. Deleting:**
- Prefer "Mark as Inactive" over deletion to preserve history
- Inactive resources don't appear in assignment panels
- Inactive resources still show in historical bookings
- Can be reactivated later without losing data

### 3.2 Booking Management Behavior

**Creating Bookings:**
- At least one resource (person, vehicle, OR equipment) must be assigned
- Start time must be before end time (validated on form)
- Conflict detection runs automatically as resources are added
- Conflict warnings appear immediately below resource assignment panel
- Warnings show: Which resource conflicts, with which booking, at what time
- User can proceed despite warnings (with confirmation) or fix conflicts first
- Successful save shows notification: "Booking created successfully"
- Calendar immediately updates with new booking block

**Editing Bookings:**
- Click booking block on calendar OR click from list view
- Form opens pre-filled with current data
- Can change any field: time, resources, location, notes
- Re-validates conflicts when time or resources change
- "Save" updates booking, "Cancel" discards changes
- All users see updates in real-time

**Deleting Bookings:**
- Confirmation required: "Delete this booking?"
- For recurring bookings: "Delete only this occurrence or all future occurrences?"
- Deletion removes booking from calendar immediately
- Deleted bookings cannot be recovered

**Recurring Bookings:**
- Options: None, Daily, Weekly, Monthly
- Creates individual booking instances (not a single linked series)
- Each instance can be edited/deleted independently
- Default: Creates 3 months of future occurrences
- Each instance shows in calendar as separate block

**Conflict Detection Logic:**
- Conflict exists if: Same resource + overlapping time
- Overlap means: New booking starts before existing ends AND new booking ends after existing starts
- Checked across ALL resource types (people, vehicles, equipment)
- Example conflict:
  - Existing: John Smith, Monday 10:00 AM - 2:00 PM
  - New attempt: John Smith, Monday 11:00 AM - 3:00 PM
  - Result: ⚠️ Conflict detected (1 hour overlap from 11 AM - 2 PM)

### 3.3 Calendar Behavior

**View Modes:**
- **Day View:** 24-hour timeline, one day, shows all bookings for that day
- **Week View:** 7-day grid, Monday-Sunday, shows week at a glance
- **Month View:** Calendar grid, shows all bookings in a month (condensed view)

**Navigation:**
- Previous/Next buttons move by view period (day, week, or month)
- "Today" button jumps to current date
- Date picker allows jumping to specific date

**Booking Blocks:**
- Height represents duration
- Color-coded by resource type or booking status
- Shows: Booking title + time
- Hover shows tooltip with full details
- Click opens booking detail modal

**Filtering:**
- Checkboxes: [✓] People [✓] Vehicles [✓] Equipment
- Unchecking a type hides those bookings from calendar
- Filters persist during session
- Reset button clears all filters

**Drag-and-Drop (Admin Only):**
- Dragging a booking shows ghost element
- Drop zones are valid time slots
- Validates conflicts before allowing drop
- Confirmation modal appears before committing change
- Invalid drops (conflict or outside working hours) are rejected with warning

### 3.4 Dashboard Behavior

**Stats Cards:**
- **Total Resources:** Count of active people + vehicles + equipment
- **Scheduled Today:** Count of bookings with today's date
- **Utilization Rate:** Percentage of resources with ≥1 booking today
- **Conflicts:** Count of detected conflicts in next 7 days

**Today's Bookings:**
- Lists bookings with start time today
- Sorted by start time (earliest first)
- Shows: Time, title, assigned resources (icons)
- Click to view details

**Recent Activity:**
- Last 10 booking changes (created, edited, deleted)
- Shows: "Created 'Site Visit'" - 5 minutes ago
- Real-time updates when changes occur

**Quick Actions:**
- "Add Resource" button opens resource creation modal
- "Create Booking" button opens booking form modal

### 3.5 Authentication Behavior

**Login:**
- Email and password required
- "Remember me" checkbox (optional - keeps session for 30 days)
- Invalid credentials show error: "Invalid email or password"
- Successful login redirects to Dashboard
- Auth token stored in localStorage

**Session Management:**
- Token expires after 24 hours (configurable)
- Expired token automatically redirects to login
- "Logout" button clears token and redirects to login
- Session persists across browser tabs

**Permissions:**
- Admin sees all features: Create, Edit, Delete buttons
- Member sees read-only views: No Create/Edit/Delete buttons
- Member attempting to access admin URL redirects to Dashboard with warning

### 3.6 Real-Time Sync Behavior

**When User A creates/edits/deletes a booking:**
- User B's calendar updates within 1-2 seconds
- User B's dashboard stats recalculate
- No page refresh required
- Notification appears (optional): "Calendar updated"

**When User A edits a resource:**
- User B's resource list updates
- If resource is currently displayed in a booking, details update
- Assignment panels refresh to show new data

**Conflict Resolution:**
- If two users create conflicting bookings simultaneously:
- Both succeed initially
- Backend detects conflict on save
- Later user sees warning: "Conflict detected after save. Please review."
- Option to keep or modify booking

### 3.7 Mobile Behavior

**Responsive Design:**
- Navigation sidebar collapses to hamburger menu
- Calendar switches to list view on small screens (< 768px)
- Booking blocks stack vertically
- Touch-optimized buttons (minimum 44px tap targets)
- Forms adapt to single-column layout
- Modals take full screen on mobile

**Mobile Interactions:**
- Tap booking to view details
- Swipe left/right to navigate days (Day view)
- Pull to refresh updates data
- Drag-and-drop disabled on mobile (use edit form instead)

### 3.8 Error Handling Behavior

**Network Errors:**
- Lost connection: "Unable to connect. Check your internet connection."
- Retry button appears
- Cached data remains visible
- Changes queued until connection restored (optional)

**Validation Errors:**
- Inline errors appear immediately below fields
- Submit button disabled until all errors resolved
- Error messages are specific: "Name is required" not "Invalid input"

**Server Errors:**
- 500 errors show: "Something went wrong. Please try again."
- 404 errors show: "Resource not found."
- 403 errors show: "You don't have permission to perform this action."

**Conflict Errors:**
- Shown as warnings, not blocking errors
- User can choose to proceed or fix
- Visual indicator (yellow warning icon) instead of red error

---

## 4. Success Criteria

### 4.1 User Adoption Metrics
- 80%+ of operations managers log in daily
- 60%+ of field workers log in at least weekly
- Average of 50+ bookings created per company per week

### 4.2 Efficiency Metrics
- Time to create a booking: < 60 seconds
- Time to find resource availability: < 10 seconds
- Conflict detection accuracy: 100%
- Reduction in double-bookings: 95%+ compared to previous system

### 4.3 Performance Metrics
- Initial page load: < 3 seconds
- Calendar render time: < 1 second for 100 bookings
- Real-time sync latency: < 2 seconds
- Mobile responsiveness: 100% on devices 320px+ width

### 4.4 Usability Metrics
- User task completion rate: > 90%
- Average clicks to create booking: ≤ 8
- User satisfaction score: ≥ 4.0/5.0
- Support tickets per active user: < 0.1/month

---

## 5. Technical Stack

| Component | Technology |
|-----------|------------|
| UI Library | React 18+ |
| State/Data | Backbone.js (Models, Collections, Router) |
| Styling | Tailwind CSS or CSS Modules |
| Build Tool | Vite |
| HTTP Client | Axios (wrapped in Backbone.sync) |
| Package Manager | npm or yarn |

---

## 6. Project Architecture

```
schpro-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Calendar/
│   │   │   ├── CalendarView.jsx
│   │   │   ├── DayView.jsx
│   │   │   ├── WeekView.jsx
│   │   │   ├── MonthView.jsx
│   │   │   └── BookingBlock.jsx
│   │   ├── ResourceList/
│   │   │   ├── ResourceList.jsx
│   │   │   ├── ResourceItem.jsx
│   │   │   └── ResourceFilters.jsx
│   │   ├── BookingForm/
│   │   │   ├── BookingForm.jsx
│   │   │   └── RecurrenceSelector.jsx
│   │   ├── ResourceAssignment/
│   │   │   ├── ResourceAssignmentPanel.jsx
│   │   │   ├── ResourceTabs.jsx
│   │   │   ├── ResourceList.jsx
│   │   │   ├── ResourceListItem.jsx
│   │   │   ├── BookingContextCard.jsx
│   │   │   └── AssignedResourceChip.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── RecentActivity.jsx
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── common/
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       ├── Input.jsx
│   │       ├── Select.jsx
│   │       └── Alert.jsx
│   ├── models/              # Backbone models
│   │   ├── Person.js
│   │   ├── Vehicle.js
│   │   ├── Equipment.js
│   │   ├── Booking.js
│   │   ├── User.js
│   │   └── Company.js
│   ├── collections/         # Backbone collections
│   │   ├── People.js
│   │   ├── Vehicles.js
│   │   ├── Equipment.js
│   │   ├── Bookings.js
│   │   └── Users.js
│   ├── hooks/               # React-Backbone integration
│   │   ├── useBackboneModel.js
│   │   ├── useBackboneCollection.js
│   │   └── useAuth.js
│   ├── router/              # Backbone Router
│   │   └── AppRouter.js
│   ├── services/            # API configuration
│   │   ├── api.js
│   │   └── backboneSync.js
│   ├── views/               # Page-level components
│   │   ├── DashboardPage.jsx
│   │   ├── CalendarPage.jsx
│   │   ├── ResourcesPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── LoginPage.jsx
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── conflictDetection.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── assets/
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 4. Core Features

### 4.1 Authentication

**Requirements:**
- Login form with email/password
- Session management via API tokens (stored in localStorage)
- Auto-logout on token expiration
- Role-based UI rendering (Admin vs Member)
- Redirect to login on unauthenticated access

**User Model:**
```javascript
const User = Backbone.Model.extend({
    urlRoot: '/api/auth/me',
    defaults: {
        id: null,
        email: '',
        name: '',
        role: 'member', // 'admin' | 'member'
        company_id: null
    },
    isAdmin() {
        return this.get('role') === 'admin';
    }
});
```

---

### 4.2 Dashboard

**Requirements:**
- Overview of today's bookings
- Quick stats cards:
  - Total resources
  - Scheduled today
  - Utilization rate
  - Conflicts detected
- Recent activity feed (last 10 booking changes)
- Quick actions: "Add Resource", "Create Booking"

**UI Components:**
- `StatsCard` - Display single metric with icon
- `RecentActivity` - List of recent booking events
- `TodayBookings` - Summary list of today's assignments

---

### 4.3 Calendar View

**Requirements:**
- Day / Week / Month view toggle
- Filter by resource type (people, vehicles, equipment)
- Color-coded booking blocks by resource or job type
- Drag-and-drop to reschedule (Admin only)
- Click to view/edit booking details
- Visual indicator for conflicts

**Calendar Component Props:**
```typescript
interface CalendarViewProps {
    view: 'day' | 'week' | 'month';
    date: Date;
    bookings: Backbone.Collection;
    resources: Backbone.Collection;
    filters: {
        resourceTypes: string[];
        resourceIds: number[];
    };
    onBookingClick: (booking: Booking) => void;
    onBookingDrop: (bookingId: number, newStart: Date, newEnd: Date) => void;
    onDateChange: (date: Date) => void;
}
```

**Drag & Drop:**
- Use native HTML5 drag-and-drop or library (react-dnd)
- Show ghost element while dragging
- Validate drop target (check for conflicts)
- Confirm reschedule via modal

---

### 4.4 Resource Management (Admin Only)

**Requirements:**
- Tabbed view with People, Vehicles, Equipment tabs
- List view with search and filters for each entity type
- CRUD operations for each entity type
- Type-specific fields and validation
- Availability settings (working hours, days off)
- Active/inactive toggle

**Person Model:**
```javascript
const Person = Backbone.Model.extend({
    urlRoot: '/api/people',
    defaults: {
        id: null,
        name: '',
        email: '',
        phone: '',
        skills: [],
        certifications: [],
        hourly_rate: null,
        is_active: true,
        availability: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: null,
            sunday: null
        }
    },
    validate(attrs) {
        if (!attrs.name || attrs.name.trim() === '') {
            return 'Name is required';
        }
    }
});
```

**Vehicle Model:**
```javascript
const Vehicle = Backbone.Model.extend({
    urlRoot: '/api/vehicles',
    defaults: {
        id: null,
        name: '',
        make: '',
        model: '',
        year: null,
        license_plate: '',
        vin: '',
        capacity: '',
        is_active: true,
        availability: {
            monday: { start: '06:00', end: '20:00' },
            tuesday: { start: '06:00', end: '20:00' },
            wednesday: { start: '06:00', end: '20:00' },
            thursday: { start: '06:00', end: '20:00' },
            friday: { start: '06:00', end: '20:00' },
            saturday: null,
            sunday: null
        }
    },
    validate(attrs) {
        if (!attrs.name || attrs.name.trim() === '') {
            return 'Name is required';
        }
    }
});
```

**Equipment Model:**
```javascript
const Equipment = Backbone.Model.extend({
    urlRoot: '/api/equipment',
    defaults: {
        id: null,
        name: '',
        serial_number: '',
        manufacturer: '',
        model: '',
        condition: 'good', // 'excellent' | 'good' | 'fair' | 'poor'
        last_maintenance: null,
        next_maintenance: null,
        is_active: true,
        availability: {
            monday: { start: '06:00', end: '20:00' },
            tuesday: { start: '06:00', end: '20:00' },
            wednesday: { start: '06:00', end: '20:00' },
            thursday: { start: '06:00', end: '20:00' },
            friday: { start: '06:00', end: '20:00' },
            saturday: null,
            sunday: null
        }
    },
    validate(attrs) {
        if (!attrs.name || attrs.name.trim() === '') {
            return 'Name is required';
        }
    }
});
```

**Collections:**
```javascript
const People = Backbone.Collection.extend({
    model: Person,
    url: '/api/people',

    active() {
        return this.where({ is_active: true });
    }
});

const Vehicles = Backbone.Collection.extend({
    model: Vehicle,
    url: '/api/vehicles',

    active() {
        return this.where({ is_active: true });
    }
});

const EquipmentCollection = Backbone.Collection.extend({
    model: Equipment,
    url: '/api/equipment',

    active() {
        return this.where({ is_active: true });
    }
});
```

---

### 4.5 Booking Management

**Requirements:**
- Create/edit/delete bookings (Admin only)
- Assign people, vehicles, and equipment to time slot
- Required fields: at least one entity, start time, end time, title
- Optional: location, notes, recurrence rule
- Conflict detection with warning before save (checks all entity types)
- Recurring bookings (daily, weekly, monthly)

**Booking Model:**
```javascript
const Booking = Backbone.Model.extend({
    urlRoot: '/api/bookings',
    defaults: {
        id: null,
        person_ids: [],        // Array of assigned person IDs
        vehicle_ids: [],       // Array of assigned vehicle IDs
        equipment_ids: [],     // Array of assigned equipment IDs
        title: '',
        location: '',          // Booking location
        start_time: null,
        end_time: null,
        notes: '',
        recurrence_rule: null, // null | 'daily' | 'weekly' | 'monthly'
        // Populated by server on fetch
        people: [],
        vehicles: [],
        equipment: []
    },
    validate(attrs) {
        const hasEntities = (attrs.person_ids?.length > 0) ||
                           (attrs.vehicle_ids?.length > 0) ||
                           (attrs.equipment_ids?.length > 0);
        if (!hasEntities) {
            return 'At least one person, vehicle, or equipment is required';
        }
        if (!attrs.start_time || !attrs.end_time) {
            return 'Start and end time are required';
        }
        if (new Date(attrs.start_time) >= new Date(attrs.end_time)) {
            return 'End time must be after start time';
        }
    },

    // Helper to get all assigned entity IDs by type
    getEntityIds(type) {
        switch(type) {
            case 'person': return this.get('person_ids') || [];
            case 'vehicle': return this.get('vehicle_ids') || [];
            case 'equipment': return this.get('equipment_ids') || [];
            default: return [];
        }
    }
});
```

**Bookings Collection:**
```javascript
const Bookings = Backbone.Collection.extend({
    model: Booking,
    url: '/api/bookings',

    forPerson(personId) {
        return this.filter(booking => {
            const personIds = booking.get('person_ids') || [];
            return personIds.includes(personId);
        });
    },

    forVehicle(vehicleId) {
        return this.filter(booking => {
            const vehicleIds = booking.get('vehicle_ids') || [];
            return vehicleIds.includes(vehicleId);
        });
    },

    forEquipment(equipmentId) {
        return this.filter(booking => {
            const equipmentIds = booking.get('equipment_ids') || [];
            return equipmentIds.includes(equipmentId);
        });
    },

    inDateRange(start, end) {
        return this.filter(booking => {
            const bookingStart = new Date(booking.get('start_time'));
            const bookingEnd = new Date(booking.get('end_time'));
            return bookingStart < end && bookingEnd > start;
        });
    },

    findConflicts(personIds, vehicleIds, equipmentIds, start, end, excludeId = null) {
        return this.filter(booking => {
            if (booking.id === excludeId) return false;

            // Check if any entity overlaps
            const bookingPersonIds = booking.get('person_ids') || [];
            const bookingVehicleIds = booking.get('vehicle_ids') || [];
            const bookingEquipmentIds = booking.get('equipment_ids') || [];

            const hasOverlappingPerson = personIds.some(id => bookingPersonIds.includes(id));
            const hasOverlappingVehicle = vehicleIds.some(id => bookingVehicleIds.includes(id));
            const hasOverlappingEquipment = equipmentIds.some(id => bookingEquipmentIds.includes(id));

            if (!hasOverlappingPerson && !hasOverlappingVehicle && !hasOverlappingEquipment) {
                return false;
            }

            // Check time overlap
            const bookingStart = new Date(booking.get('start_time'));
            const bookingEnd = new Date(booking.get('end_time'));
            return bookingStart < new Date(end) && bookingEnd > new Date(start);
        });
    }
});
```

**ResourceAssignmentPanel Component:**

A transfer-list style UI for assigning people, vehicles, and equipment to a booking.

```
┌───────────────────────────┐     ┌───────────────────────────┐
│ Available                 │     │ Booking                   │
├───────────────────────────┤     ├───────────────────────────┤
│ [People][Vehicles][Equip] │     │ 📍 123 Main Street        │
├───────────────────────────┤     │ 📅 Jan 25, 2026           │
│ 🔍 Search people...       │     │ 🕐 9:00 AM - 12:00 PM     │
├───────────────────────────┤     │                           │
│ ☐ Jane Doe                │     ├───────────────────────────┤
│ ☐ Bob Wilson              │ ──▶ │ Assigned:                 │
│ ☐ Sarah Chen              │     │ ┌───────────────────────┐ │
│ ☐ Mike Johnson            │ ◀── │ │ 👤 John Smith      ✕ │ │
│                           │     │ │ 🚗 Ford F-150 #2   ✕ │ │
│                           │     │ │ 🔧 Excavator #1    ✕ │ │
└───────────────────────────┘     └───────────────────────────┘
```

```typescript
interface ResourceAssignmentPanelProps {
    // Booking context
    booking: {
        title: string;
        location: string;
        start_time: Date;
        end_time: Date;
    };

    // Separate collections for each entity type
    peopleCollection: Backbone.Collection;
    vehiclesCollection: Backbone.Collection;
    equipmentCollection: Backbone.Collection;

    // Selected IDs for each type
    selectedPersonIds: number[];
    selectedVehicleIds: number[];
    selectedEquipmentIds: number[];

    // Callbacks for each type
    onPersonAdd: (personId: number) => void;
    onPersonRemove: (personId: number) => void;
    onVehicleAdd: (vehicleId: number) => void;
    onVehicleRemove: (vehicleId: number) => void;
    onEquipmentAdd: (equipmentId: number) => void;
    onEquipmentRemove: (equipmentId: number) => void;
}
```

**Left Panel - Entity Selection:**
- **Tabs:** People | Vehicles | Equipment (each tab loads its own collection)
- **Search:** Filter within the active tab
- **List:** Clickable items to add to booking
- **State:** Already-assigned items shown with checkmark or hidden from list

**Right Panel - Booking Context:**
- **Header:** Booking location/title
- **Details:** Date and time range
- **Assigned Entities:** Chips/tags with type icon and remove (✕) button
- Shows people, vehicles, and equipment together

**Interactions:**
1. Click entity in left panel → adds to booking (right panel)
2. Click ✕ on chip → removes from booking
3. Switch tabs → shows different entity type from its collection
4. Search → filters current tab's entities

**BookingForm Integration:**

The BookingForm component uses ResourceAssignmentPanel with separate entity collections:

```javascript
// BookingForm.jsx - entity selection section
<ResourceAssignmentPanel
    booking={{
        title: formData.title,
        location: formData.location,
        start_time: formData.start_time,
        end_time: formData.end_time
    }}
    peopleCollection={peopleCollection}
    vehiclesCollection={vehiclesCollection}
    equipmentCollection={equipmentCollection}
    selectedPersonIds={formData.person_ids}
    selectedVehicleIds={formData.vehicle_ids}
    selectedEquipmentIds={formData.equipment_ids}
    onPersonAdd={(id) => setFormData({
        ...formData,
        person_ids: [...formData.person_ids, id]
    })}
    onPersonRemove={(id) => setFormData({
        ...formData,
        person_ids: formData.person_ids.filter(pid => pid !== id)
    })}
    onVehicleAdd={(id) => setFormData({
        ...formData,
        vehicle_ids: [...formData.vehicle_ids, id]
    })}
    onVehicleRemove={(id) => setFormData({
        ...formData,
        vehicle_ids: formData.vehicle_ids.filter(vid => vid !== id)
    })}
    onEquipmentAdd={(id) => setFormData({
        ...formData,
        equipment_ids: [...formData.equipment_ids, id]
    })}
    onEquipmentRemove={(id) => setFormData({
        ...formData,
        equipment_ids: formData.equipment_ids.filter(eid => eid !== id)
    })}
/>
```

---

### 4.6 Member View

**Requirements:**
- View assigned bookings only (or all, based on settings)
- Cannot create/edit/delete bookings
- Can update own availability (if linked to a resource)
- Read-only calendar view
- Filtered view of personal bookings

---

## 5. React-Backbone Integration

### 5.1 useBackboneModel Hook

```javascript
import { useState, useEffect, useCallback } from 'react';

export function useBackboneModel(model) {
    const [attributes, setAttributes] = useState(model.toJSON());
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const onChange = () => setAttributes(model.toJSON());
        const onSync = () => setIsSyncing(false);
        const onError = (model, response) => {
            setIsSyncing(false);
            setError(response.responseJSON?.message || 'An error occurred');
        };
        const onRequest = () => setIsSyncing(true);

        model.on('change', onChange);
        model.on('sync', onSync);
        model.on('error', onError);
        model.on('request', onRequest);

        return () => {
            model.off('change', onChange);
            model.off('sync', onSync);
            model.off('error', onError);
            model.off('request', onRequest);
        };
    }, [model]);

    const save = useCallback((attrs) => {
        setError(null);
        return model.save(attrs);
    }, [model]);

    const destroy = useCallback(() => {
        setError(null);
        return model.destroy();
    }, [model]);

    return { attributes, isSyncing, error, save, destroy };
}
```

### 5.2 useBackboneCollection Hook

```javascript
import { useState, useEffect, useCallback } from 'react';

export function useBackboneCollection(collection) {
    const [models, setModels] = useState(collection.toJSON());
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const onUpdate = () => setModels(collection.toJSON());
        const onSync = () => setIsFetching(false);
        const onError = (collection, response) => {
            setIsFetching(false);
            setError(response.responseJSON?.message || 'An error occurred');
        };
        const onRequest = () => setIsFetching(true);

        collection.on('add remove reset change', onUpdate);
        collection.on('sync', onSync);
        collection.on('error', onError);
        collection.on('request', onRequest);

        return () => {
            collection.off('add remove reset change', onUpdate);
            collection.off('sync', onSync);
            collection.off('error', onError);
            collection.off('request', onRequest);
        };
    }, [collection]);

    const fetch = useCallback((options) => {
        setError(null);
        return collection.fetch(options);
    }, [collection]);

    return { models, isFetching, error, fetch };
}
```

---

## 6. API Integration

### 6.1 Configuration

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

### 6.2 Backbone Sync Override

```javascript
// src/services/backboneSync.js
import Backbone from 'backbone';
import api from './api';

const originalSync = Backbone.sync;

Backbone.sync = function(method, model, options = {}) {
    const methodMap = {
        create: 'post',
        update: 'put',
        patch: 'patch',
        delete: 'delete',
        read: 'get'
    };

    const httpMethod = methodMap[method];
    const url = options.url || _.result(model, 'url');

    return api({
        method: httpMethod,
        url: url,
        data: method === 'read' ? undefined : model.toJSON()
    })
    .then(response => {
        if (options.success) options.success(response.data);
        return response.data;
    })
    .catch(error => {
        if (options.error) options.error(error.response);
        throw error;
    });
};
```

---

## 7. Routing

### 7.1 Backbone Router

```javascript
// src/router/AppRouter.js
import Backbone from 'backbone';

const AppRouter = Backbone.Router.extend({
    routes: {
        '': 'dashboard',
        'dashboard': 'dashboard',
        'calendar': 'calendar',
        'calendar/:view': 'calendarView',
        'resources': 'resources',
        'resources/:id': 'resourceDetail',
        'settings': 'settings',
        'login': 'login'
    },

    currentView: null,

    dashboard() {
        this.trigger('route:change', { page: 'dashboard' });
    },

    calendar() {
        this.trigger('route:change', { page: 'calendar', view: 'week' });
    },

    calendarView(view) {
        this.trigger('route:change', { page: 'calendar', view });
    },

    resources() {
        this.trigger('route:change', { page: 'resources' });
    },

    resourceDetail(id) {
        this.trigger('route:change', { page: 'resources', id: parseInt(id) });
    },

    settings() {
        this.trigger('route:change', { page: 'settings' });
    },

    login() {
        this.trigger('route:change', { page: 'login' });
    }
});

export default new AppRouter();
```

### 7.2 React Router Integration

```javascript
// src/hooks/useRouter.js
import { useState, useEffect } from 'react';
import router from '../router/AppRouter';

export function useRouter() {
    const [route, setRoute] = useState({ page: 'dashboard' });

    useEffect(() => {
        router.on('route:change', setRoute);
        Backbone.history.start({ pushState: true });

        return () => {
            router.off('route:change', setRoute);
        };
    }, []);

    const navigate = (path) => {
        router.navigate(path, { trigger: true });
    };

    return { route, navigate };
}
```

---

## 8. UI Components Specifications

### 8.1 Common Components

| Component | Props | Description |
|-----------|-------|-------------|
| Button | variant, size, disabled, onClick | Primary/secondary/danger styles |
| Modal | isOpen, onClose, title, children | Overlay dialog |
| Input | type, label, error, value, onChange | Form input with label |
| Select | options, value, onChange, placeholder | Dropdown select |
| Alert | type, message, onDismiss | Success/error/warning alerts |
| Spinner | size | Loading indicator |
| Badge | variant, children | Status badges |

### 8.2 Color Coding

| Resource Type | Icon | Color |
|---------------|------|-------|
| Person | 👤 | Blue (#3B82F6) |
| Vehicle | 🚗 | Green (#10B981) |
| Equipment | 🔧 | Orange (#F59E0B) |

| Booking Status | Color |
|----------------|-------|
| Confirmed | Green |
| Tentative | Yellow |
| Conflict | Red |

---

## 9. Environment Variables

```env
# .env.example
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=SchedulePro
```

---

## 10. Build & Deployment

### 10.1 Development
```bash
npm install
npm run dev
```

### 10.2 Production Build
```bash
npm run build
npm run preview
```

### 10.3 Deployment
- Static hosting: Vercel, Netlify, AWS S3 + CloudFront
- Build output: `dist/` folder

---

## 11. Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

---

## 12. Accessibility Requirements

- Keyboard navigation for all interactive elements
- ARIA labels on icons and buttons
- Focus management in modals
- Color contrast ratio minimum 4.5:1
- Screen reader compatible calendar

---

*Document Version: 2.0*
*Last Updated: January 2026*
*Change: Separated resources into People, Vehicles, and Equipment entities*
