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
- **Multi-Resource Bookings** - Assign multiple people, vehicles, and equipment to a single booking/job using a transfer-list interface
- **Conflict Detection** - Warnings when attempting to double-book any resource
- **Role-Based Access** - Admin users manage the system; Member users view their assigned bookings
- **Real-Time Sync** - All users see updates immediately when bookings are created, modified, or deleted
- **Soft Delete with Undelete** - Deleted items remain visible and can be restored by clicking "Undelete"
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
- ✅ Single view showing all resource types together
- ✅ Conflict detection when creating bookings
- ✅ Clear visibility into resource assignments
- ✅ Easy assignment with transfer-list interface
- ✅ Complete job view showing all assigned people, vehicles, and equipment
- ✅ Organized booking management
- ✅ Reduced double-bookings

---

## 2. User Stories & Workflows

### 2.1 Admin User Stories

**As an Admin, I want to:**

1. **Manage Resource Inventory**
   - Add new people to the system with their skills and certifications
   - Add vehicles with license plates and capacity
   - Add equipment with serial numbers and condition status
   - Edit resource details when information changes
   - Delete resources with ability to undo before permanent removal
   - Search and filter resources by type, status, or name

2. **Create and Manage Bookings**
   - Create a booking by selecting date/time and assigning resources using transfer-list interface
   - Assign multiple people, vehicles, and equipment to a single booking
   - See warnings if any resource is already booked during that time
   - Add booking details: title, location, notes
   - Edit existing bookings to change time or assigned resources
   - Delete bookings with ability to undo before permanent removal

3. **View Bookings**
   - View all bookings in a table/list format
   - Filter bookings by date range, resource, or status
   - Sort bookings by date, title, or created time
   - See booking details at a glance
   - View dashboard with key metrics (total bookings, today's bookings)

4. **Handle Conflicts**
   - Get warnings when attempting to double-book a resource
   - Review conflicts before saving a booking

### 2.2 Member User Stories

**As a Member, I want to:**

1. **View My Schedule**
   - See all bookings I'm assigned to in a list
   - View my schedule for today, this week, or upcoming dates
   - Access my schedule from my mobile phone while in the field
   - See details of each booking: time, location, notes, other assigned resources

2. **Stay Informed**
   - Know what resources (vehicles, equipment) are assigned to my bookings
   - See if I'm working with other team members on a job
   - View upcoming bookings to plan my day/week

### 2.3 Key User Workflows

#### Workflow 1: Create a New Booking (Admin)

1. Admin navigates to Bookings page or Dashboard
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
12. If conflicts exist, warning is displayed
13. Admin clicks "Save Booking"
14. Success message appears
15. Bookings list updates with new booking
16. All users see the new booking immediately

#### Workflow 2: View Schedule (Member)

1. Member logs in
2. Dashboard shows today's bookings assigned to them
3. Member clicks "My Bookings" in sidebar
4. List view shows all their bookings
5. Member clicks on a booking row
6. Modal shows booking details:
   - Title: "Site Visit - 123 Oak Street"
   - Location: "123 Oak Street, Springfield"
   - Time: Monday 9:00 AM - 12:00 PM
   - Notes: "Bring ladder and electrical tools"
   - Assigned people: John Smith (me), Jane Doe
   - Assigned vehicles: Ford F-150 #2
   - Assigned equipment: Excavator #1
7. Member closes modal

#### Workflow 3: Manage Resources (Admin)

1. Admin navigates to Resources page
2. Sees three tabs: People | Vehicles | Equipment
3. Clicks "People" tab (default)
4. Sees list of all people with:
   - Name, email, skills, certifications
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
8. Clicks "Save"
9. Sarah Chen appears in the people list
10. Sarah is now available for assignment to bookings

---

## 3. Functional Requirements & Behavior

### 3.1 Resource Management Behavior

**Creating Resources:**
- Form validation occurs in real-time (name required before save)
- Changes are saved immediately to the backend
- Success notification appears after save
- Resource immediately appears in assignment lists

**Editing Resources:**
- Editing opens a pre-filled form modal
- Validation prevents saving invalid data (e.g., empty name)
- "Cancel" button discards changes
- Changes sync in real-time to other logged-in users

**Deleting Resources (Soft Delete):**
- Confirmation modal appears: "Are you sure you want to delete [Resource Name]?"
- Clicking "Delete" sets `is_deleted = 1` and persists to database via API
- Deleted resources are visually distinguished in lists (e.g., grayed out, strikethrough)
- Deleted resources don't appear in assignment panels (only non-deleted resources can be assigned)
- "Undelete" button appears for deleted resources
- Clicking "Undelete" sets `is_deleted = 0` and restores the resource immediately
- Deleted resources can be filtered out of view with a "Hide deleted" toggle

### 3.2 Booking Management Behavior

**Creating Bookings:**
- At least one resource (person, vehicle, OR equipment) must be assigned
- Start time must be before end time (validated on form)
- Conflict detection runs when saving
- If conflicts exist, a warning is displayed
- Successful save shows notification: "Booking created successfully"
- Bookings list immediately updates with new booking

**Editing Bookings:**
- Click booking row from list view
- Form opens pre-filled with current data
- Can change any field: time, resources, location, notes
- "Save" updates booking, "Cancel" discards changes
- All users see updates in real-time

**Deleting Bookings (Soft Delete):**
- Confirmation required: "Delete this booking?"
- Clicking "Delete" sets `is_deleted = 1` and persists to database via API
- Deleted bookings are visually distinguished in lists (e.g., grayed out, strikethrough)
- "Undelete" button appears for deleted bookings
- Clicking "Undelete" sets `is_deleted = 0` and restores the booking immediately
- Deleted bookings can be filtered out of view with a "Hide deleted" toggle

**Conflict Detection:**
- Basic detection checks if the same resource is assigned to overlapping time slots
- Detailed conflict resolution behavior will be defined after basic features are implemented

### 3.3 Bookings List Behavior

**Table View:**
- Displays all bookings in a sortable table
- Columns: Date/Time, Title, Location, Assigned Resources, Actions
- Default sort: Upcoming bookings first (by start time)
- Click column header to change sort order
- Pagination: 50 bookings per page
- Deleted bookings shown with visual distinction (grayed out, strikethrough)

**Filtering:**
- Date range picker: Filter by start/end dates
- Resource filter: Show bookings with specific people, vehicles, or equipment
- Search: Filter by title or location
- "Hide deleted" toggle: Filter out deleted bookings from view
- "Clear Filters" button resets all filters

**Row Actions:**
- Click row to view booking details in modal
- "Edit" button (Admin only) opens edit form
- "Delete" button (Admin only) soft deletes booking (sets `is_deleted = 1`)
- "Undelete" button (Admin only, shown for deleted bookings) restores booking (sets `is_deleted = 0`)

**Empty States:**
- No bookings: "No bookings found. Create your first booking to get started."
- No results after filtering: "No bookings match your filters. Try adjusting your search."

### 3.4 Dashboard Behavior

**Stats Cards:**
- **Total Resources:** Count of people + vehicles + equipment
- **Total Bookings:** Count of all bookings
- **Today's Bookings:** Count of bookings with today's date
- **Upcoming Bookings:** Count of bookings in next 7 days

**Today's Bookings:**
- Lists bookings with start time today
- Sorted by start time (earliest first)
- Shows: Time, title, assigned resources (icons)
- Click to view details

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
- User B's bookings list updates within 1-2 seconds
- User B's dashboard stats recalculate
- No page refresh required

**When User A edits a resource:**
- User B's resource list updates
- If resource is currently displayed in a booking, details update
- Assignment panels refresh to show new data

### 3.7 Mobile Behavior

**Responsive Design:**
- Navigation sidebar collapses to hamburger menu
- Tables adapt to card layout on small screens (< 768px)
- Touch-optimized buttons (minimum 44px tap targets)
- Forms adapt to single-column layout
- Modals take full screen on mobile

**Mobile Interactions:**
- Tap booking row to view details
- Pull to refresh updates data
- Swipe actions for quick edit/delete (optional enhancement)

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

**Conflict Warnings:**
- Shown as warnings when detected
- Visual indicator (yellow warning icon)
- Specific behavior to be defined in later phases

---

## 4. Success Criteria

### 4.1 User Adoption Metrics
- 80%+ of operations managers log in daily
- 60%+ of field workers log in at least weekly
- Average of 50+ bookings created per company per week

### 4.2 Efficiency Metrics
- Time to create a booking: < 60 seconds
- Reduction in double-bookings compared to previous system

### 4.3 Performance Metrics
- Initial page load: < 3 seconds
- Bookings list render time: < 1 second for 100 bookings
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
│   │   ├── BookingsList/
│   │   │   ├── BookingsList.jsx
│   │   │   ├── BookingRow.jsx
│   │   │   ├── BookingFilters.jsx
│   │   │   └── BookingDetailsModal.jsx
│   │   ├── ResourceList/
│   │   │   ├── ResourceList.jsx
│   │   │   ├── ResourceItem.jsx
│   │   │   └── ResourceFilters.jsx
│   │   ├── BookingForm/
│   │   │   └── BookingForm.jsx
│   │   ├── ResourceAssignment/
│   │   │   ├── ResourceAssignmentPanel.jsx
│   │   │   ├── ResourceTabs.jsx
│   │   │   ├── ResourceList.jsx
│   │   │   ├── ResourceListItem.jsx
│   │   │   ├── BookingContextCard.jsx
│   │   │   └── AssignedResourceChip.jsx
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── StatsCard.jsx
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
│   │   ├── BookingsPage.jsx
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
  - Total bookings
  - Today's bookings
  - Upcoming bookings (next 7 days)
- Quick actions: "Add Resource", "Create Booking"

**UI Components:**
- `StatsCard` - Display single metric with icon
- `TodayBookings` - Summary list of today's assignments

---

### 4.3 Bookings List View

**Requirements:**
- Table/list display of all bookings
- Sortable columns (date, title, location)
- Filter by date range, resource, search term
- Pagination (50 items per page)
- Click row to view booking details
- Edit/Delete actions (Admin only)

**BookingsListView Component Props:**
```typescript
interface BookingsListViewProps {
    bookings: Backbone.Collection;
    filters: {
        dateRange: { start: Date; end: Date };
        resourceIds: number[];
        searchTerm: string;
    };
    sortBy: 'date' | 'title' | 'location';
    sortOrder: 'asc' | 'desc';
    onBookingClick: (booking: Booking) => void;
    onFilterChange: (filters: object) => void;
    onSortChange: (sortBy: string, sortOrder: string) => void;
}
```

**UI Components:**
- `BookingsList` - Main table/list container
- `BookingRow` - Individual booking row
- `BookingFilters` - Filter controls panel
- `BookingDetailsModal` - View/edit booking details

---

### 4.4 Resource Management (Admin Only)

**Requirements:**
- Tabbed view with People, Vehicles, Equipment tabs
- List view with search and filters for each entity type
- CRUD operations for each entity type with soft delete
- Type-specific fields and validation
- "Hide deleted" toggle to filter out deleted resources from view
- Deleted resources shown with visual distinction (grayed out, strikethrough)
- "Undelete" button to restore deleted resources (sets `is_deleted = 0`)

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
        is_deleted: false
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
        is_deleted: false
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
        is_deleted: false
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

    deleted() {
        return this.filter(person => person.get('is_deleted'));
    }
});

const Vehicles = Backbone.Collection.extend({
    model: Vehicle,
    url: '/api/vehicles',

    deleted() {
        return this.filter(vehicle => vehicle.get('is_deleted'));
    }
});

const EquipmentCollection = Backbone.Collection.extend({
    model: Equipment,
    url: '/api/equipment',

    deleted() {
        return this.filter(equip => equip.get('is_deleted'));
    }
});
```

---

### 4.5 Booking Management

**Requirements:**
- Create/edit/delete bookings with soft delete (Admin only)
- Assign people, vehicles, and equipment to time slot using transfer-list interface
- Required fields: at least one entity, start time, end time, title
- Optional: location, notes
- Basic conflict detection with warning before save

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
        is_deleted: false,
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

    deleted() {
        return this.filter(booking => booking.get('is_deleted'));
    },

    forPerson(personId, includeDeleted = false) {
        return this.filter(booking => {
            if (!includeDeleted && booking.get('is_deleted')) return false;
            const personIds = booking.get('person_ids') || [];
            return personIds.includes(personId);
        });
    },

    forVehicle(vehicleId, includeDeleted = false) {
        return this.filter(booking => {
            if (!includeDeleted && booking.get('is_deleted')) return false;
            const vehicleIds = booking.get('vehicle_ids') || [];
            return vehicleIds.includes(vehicleId);
        });
    },

    forEquipment(equipmentId, includeDeleted = false) {
        return this.filter(booking => {
            if (!includeDeleted && booking.get('is_deleted')) return false;
            const equipmentIds = booking.get('equipment_ids') || [];
            return equipmentIds.includes(equipmentId);
        });
    },

    inDateRange(start, end, includeDeleted = false) {
        return this.filter(booking => {
            if (!includeDeleted && booking.get('is_deleted')) return false;
            const bookingStart = new Date(booking.get('start_time'));
            const bookingEnd = new Date(booking.get('end_time'));
            return bookingStart < end && bookingEnd > start;
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
- Read-only bookings list view
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
