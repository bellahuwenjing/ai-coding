# PRD: Frontend Application
## SchedulePro - React + Backbone.js Scheduling App

---

## 1. Overview

### 1.1 Product Summary
A scheduling application for managing people, vehicles, and equipment built with React for UI and Backbone.js for data management and routing.

### 1.2 Target Users
- **Admin Users:** Full access to create, edit, delete resources and bookings
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
│   │   ├── Resource.js
│   │   ├── Booking.js
│   │   ├── User.js
│   │   └── Company.js
│   ├── collections/         # Backbone collections
│   │   ├── Resources.js
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
- List view with search and filters
- CRUD operations for resources
- Resource types: Person, Vehicle, Equipment
- Availability settings (working hours, days off)
- Skills/certifications (for people type)
- Active/inactive toggle

**Resource Model:**
```javascript
const Resource = Backbone.Model.extend({
    urlRoot: '/api/resources',
    defaults: {
        id: null,
        name: '',
        type: 'person', // 'person' | 'vehicle' | 'equipment'
        is_active: true,
        availability: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' },
            saturday: null,
            sunday: null
        },
        metadata: {
            // For person: skills, certifications, phone, email
            // For vehicle: make, model, license_plate, capacity
            // For equipment: serial_number, condition
        }
    },
    validate(attrs) {
        if (!attrs.name || attrs.name.trim() === '') {
            return 'Name is required';
        }
        if (!['person', 'vehicle', 'equipment'].includes(attrs.type)) {
            return 'Invalid resource type';
        }
    }
});
```

**Resources Collection:**
```javascript
const Resources = Backbone.Collection.extend({
    model: Resource,
    url: '/api/resources',

    byType(type) {
        return this.where({ type });
    },

    active() {
        return this.where({ is_active: true });
    }
});
```

---

### 4.5 Booking Management

**Requirements:**
- Create/edit/delete bookings (Admin only)
- Assign resource to time slot
- Required fields: resource, start time, end time, title
- Optional: notes, recurrence rule
- Conflict detection with warning before save
- Recurring bookings (daily, weekly, monthly)

**Booking Model:**
```javascript
const Booking = Backbone.Model.extend({
    urlRoot: '/api/bookings',
    defaults: {
        id: null,
        resource_ids: [],      // Array of assigned resource IDs
        title: '',
        location: '',          // Booking location
        start_time: null,
        end_time: null,
        notes: '',
        recurrence_rule: null  // null | 'daily' | 'weekly' | 'monthly'
    },
    validate(attrs) {
        if (!attrs.resource_ids || attrs.resource_ids.length === 0) {
            return 'At least one resource is required';
        }
        if (!attrs.start_time || !attrs.end_time) {
            return 'Start and end time are required';
        }
        if (new Date(attrs.start_time) >= new Date(attrs.end_time)) {
            return 'End time must be after start time';
        }
    }
});
```

**Bookings Collection:**
```javascript
const Bookings = Backbone.Collection.extend({
    model: Booking,
    url: '/api/bookings',

    forResource(resourceId) {
        return this.filter(booking => {
            const resourceIds = booking.get('resource_ids');
            return resourceIds.includes(resourceId);
        });
    },

    inDateRange(start, end) {
        return this.filter(booking => {
            const bookingStart = new Date(booking.get('start_time'));
            const bookingEnd = new Date(booking.get('end_time'));
            return bookingStart < end && bookingEnd > start;
        });
    },

    findConflicts(resourceIds, start, end, excludeId = null) {
        return this.filter(booking => {
            if (booking.id === excludeId) return false;

            // Check if any resource overlaps
            const bookingResourceIds = booking.get('resource_ids');
            const hasOverlappingResource = resourceIds.some(id =>
                bookingResourceIds.includes(id)
            );
            if (!hasOverlappingResource) return false;

            // Check time overlap
            const bookingStart = new Date(booking.get('start_time'));
            const bookingEnd = new Date(booking.get('end_time'));
            return bookingStart < new Date(end) && bookingEnd > new Date(start);
        });
    }
});
```

**ResourceAssignmentPanel Component:**

A transfer-list style UI for assigning multiple resources to a booking.

```
┌───────────────────────────┐     ┌───────────────────────────┐
│ Available Resources       │     │ Booking                   │
├───────────────────────────┤     ├───────────────────────────┤
│ [People][Vehicles][Equip] │     │ 📍 123 Main Street        │
├───────────────────────────┤     │ 📅 Jan 25, 2026           │
│ 🔍 Search people...       │     │ 🕐 9:00 AM - 12:00 PM     │
├───────────────────────────┤     │                           │
│ ☐ Jane Doe                │     ├───────────────────────────┤
│ ☐ Bob Wilson              │ ──▶ │ Assigned Resources:       │
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

    // Resources
    availableResources: Backbone.Collection;
    selectedResourceIds: number[];

    // Callbacks
    onResourceAdd: (resourceId: number) => void;
    onResourceRemove: (resourceId: number) => void;
}
```

**Left Panel - Resource Selection:**
- **Tabs:** People | Vehicles | Equipment (filter available resources by type)
- **Search:** Filter within the active tab
- **List:** Clickable resource items to add to booking
- **State:** Already-assigned resources shown with checkmark or hidden from list

**Right Panel - Booking Context:**
- **Header:** Booking location/title
- **Details:** Date and time range
- **Assigned Resources:** Chips/tags with type icon and remove (✕) button
- Shows resources from all types together

**Interactions:**
1. Click resource in left panel → adds to booking (right panel)
2. Click ✕ on chip → removes from booking
3. Switch tabs → shows different resource type
4. Search → filters current tab's resources

**BookingForm Integration:**

The BookingForm component uses ResourceAssignmentPanel instead of a single resource dropdown:

```javascript
// BookingForm.jsx - resource selection section
<ResourceAssignmentPanel
    booking={{
        title: formData.title,
        location: formData.location,
        start_time: formData.start_time,
        end_time: formData.end_time
    }}
    availableResources={resourcesCollection}
    selectedResourceIds={formData.resource_ids}
    onResourceAdd={(id) => setFormData({
        ...formData,
        resource_ids: [...formData.resource_ids, id]
    })}
    onResourceRemove={(id) => setFormData({
        ...formData,
        resource_ids: formData.resource_ids.filter(rid => rid !== id)
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

*Document Version: 1.0*
*Last Updated: January 2026*
