# PRD: Frontend Application
## SchedulePro - React + Backbone.js Scheduling App

---

## 1. Overview

### 1.1 Product Summary
A scheduling application for managing people, vehicles, and equipment built with React for UI and Backbone.js for data management and routing.

### 1.2 Target Users
- **Admin Users:** Full access to create, edit, delete people, vehicles, equipment, and bookings
- **Member Users:** View-only access to bookings, can update own availability

---

## 2. Technical Stack

| Component | Technology |
|-----------|------------|
| UI Library | React 18+ |
| State/Data | Backbone.js (Models, Collections, Router) |
| Styling | Tailwind CSS or CSS Modules |
| Build Tool | Vite |
| HTTP Client | Axios (wrapped in Backbone.sync) |
| Package Manager | npm or yarn |

---

## 3. Project Architecture

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
