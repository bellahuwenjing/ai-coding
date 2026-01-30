# localStorage Usage in SchedulePro

This document explains how localStorage is used in the SchedulePro frontend application, distinguishing between development (mock data) and production usage.

---

## Overview

**localStorage** is a browser feature that stores data persistently on your computer (like a mini database in your browser).

### Key Characteristics:
- **Persistent**: Data survives page refreshes and browser restarts
- **Domain-specific**: Each website has its own localStorage space
- **Client-side only**: Data stored in the user's browser, not on the server
- **Limited capacity**: ~5-10MB per domain (varies by browser)
- **Synchronous**: Blocking operations (can impact performance for large data)

---

## Current Usage (Development with Mock Data)

### Why We're Using localStorage Now

The app is being developed **without a backend API yet**, so localStorage serves as a temporary fake database.

### Data Flow (Development)

```
User creates person
  → mockData.js (fake API using localStorage)
  → localStorage.setItem('mock_people', JSON.stringify(updatedArray))
  → Data "persists" in browser

Page refresh
  → mockData.js reads localStorage
  → JSON.parse(localStorage.getItem('mock_people'))
  → People still there!
```

### What's Stored in localStorage (Development)

1. **mock_people** - Array of person objects
2. **mock_vehicles** - Array of vehicle objects
3. **mock_equipment** - Array of equipment objects
4. **mock_bookings** - Array of booking objects
5. **mock_next_id** - Counter for generating new IDs
6. **auth_token** - Mock JWT token (hardcoded)
7. **current_user** - Mock user object

### CRUD Operations with localStorage

**Create Person:**
```javascript
createPerson: (data) => {
  const people = JSON.parse(localStorage.getItem('mock_people'));
  const newPerson = { ...data, id: getNextId('people'), ... };
  people.push(newPerson);
  localStorage.setItem('mock_people', JSON.stringify(people)); // ← Persist
  return Promise.resolve({ data: newPerson });
}
```

**Update Person:**
```javascript
updatePerson: (id, data) => {
  const people = JSON.parse(localStorage.getItem('mock_people'));
  const index = people.findIndex(p => p.id === parseInt(id));
  people[index] = { ...people[index], ...data };
  localStorage.setItem('mock_people', JSON.stringify(people)); // ← Persist
  return Promise.resolve({ data: people[index] });
}
```

**Delete Person (Soft Delete):**
```javascript
deletePerson: (id) => {
  const people = JSON.parse(localStorage.getItem('mock_people'));
  const index = people.findIndex(p => p.id === parseInt(id));
  people[index].is_deleted = true;
  people[index].deleted_at = new Date().toISOString();
  localStorage.setItem('mock_people', JSON.stringify(people)); // ← Persist
  return Promise.resolve({ data: { success: true } });
}
```

### Viewing localStorage Data

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Local Storage** in left sidebar
4. Click on `http://localhost:5174`
5. See all stored key-value pairs

**To Reset the App:**
- Right-click on the domain → Clear
- Or run: `localStorage.clear()` in console

---

## Production Usage (With Real Backend)

### What Changes in Production

Once the backend API is ready, **localStorage will NOT store the main application data**.

### Data Flow (Production)

```
User creates person
  → Backbone model.save()
  → backboneSync.js makes real HTTP request
  → Axios → POST http://api.schedulepro.com/api/people
  → Backend saves to MySQL database
  → Response returns to frontend
  → React re-renders with server data

Page refresh
  → App fetches data from backend API
  → GET http://api.schedulepro.com/api/people
  → Backend queries MySQL database
  → Returns JSON data
```

### The Switch

In `src/services/api.js`:

**Development (Current):**
```javascript
const USE_MOCK_API = true; // Uses localStorage via mockData.js
```

**Production (Future):**
```javascript
const USE_MOCK_API = false; // Uses real backend API
```

When `USE_MOCK_API = false`:
- All CRUD operations go to the real backend
- Data persists in **MySQL database** on the server
- localStorage mock functions are not called

---

## What localStorage IS Used For in Production

Even with a real backend, localStorage has legitimate production uses:

### 1. Authentication Token ✅

**Store JWT token after login:**
```javascript
localStorage.setItem('auth_token', token)
```

**Include in API requests:**
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Remove on logout:**
```javascript
localStorage.removeItem('auth_token');
```

### 2. User Preferences ✅

**Theme preference:**
```javascript
localStorage.setItem('theme', 'dark')
const theme = localStorage.getItem('theme') || 'light'
```

**Language preference:**
```javascript
localStorage.setItem('language', 'en')
```

**Notification settings:**
```javascript
localStorage.setItem('notifications_enabled', 'true')
```

### 3. Temporary UI State ✅

**Draft form data (auto-save):**
```javascript
// Save draft while user types
localStorage.setItem('draft_booking', JSON.stringify(formData))

// Restore on page load
const draft = JSON.parse(localStorage.getItem('draft_booking'))
if (draft) {
  setFormData(draft)
}
```

**Last selected filters:**
```javascript
localStorage.setItem('last_date_filter', '2026-02-01')
```

**"Remember me" checkbox:**
```javascript
if (rememberMe) {
  localStorage.setItem('remember_email', email)
}
```

---

## Storage Comparison: Development vs Production

| Data Type | Development (Mock) | Production (Real Backend) |
|-----------|-------------------|---------------------------|
| **People data** | localStorage (mock) | MySQL database ✅ |
| **Vehicles data** | localStorage (mock) | MySQL database ✅ |
| **Equipment data** | localStorage (mock) | MySQL database ✅ |
| **Bookings data** | localStorage (mock) | MySQL database ✅ |
| **Auth token** | localStorage (mock) | localStorage ✅ |
| **User preferences** | - | localStorage ✅ |
| **Draft forms** | - | localStorage ✅ |

---

## Security Considerations

### localStorage Security Risks

⚠️ **localStorage is NOT secure for sensitive data:**
- Data stored in **plain text** (not encrypted)
- Accessible via JavaScript (XSS vulnerability)
- No expiration (data persists indefinitely)
- Shared across all tabs for the same domain

### Best Practices

✅ **DO store in localStorage:**
- Non-sensitive user preferences (theme, language)
- Auth tokens (with short expiration)
- Temporary draft data

❌ **DON'T store in localStorage:**
- Passwords (never!)
- Credit card info
- Personal identifiable information (PII)
- Sensitive business data

### JWT Token Security

**In production, JWT tokens in localStorage should:**
1. Have short expiration times (e.g., 1 hour)
2. Be refreshed automatically before expiration
3. Be removed immediately on logout
4. Use secure HttpOnly cookies as an alternative (more secure)

---

## Alternative Storage Options

### sessionStorage
- Similar to localStorage
- Data cleared when browser tab closes
- Use for: Temporary session data

### IndexedDB
- Larger storage capacity (100s of MBs)
- Asynchronous (non-blocking)
- Use for: Large datasets, offline-first apps

### HTTP Cookies
- Can be HttpOnly (not accessible via JavaScript)
- Sent automatically with requests
- Use for: Auth tokens (more secure than localStorage)

### Server-Side Sessions
- Data stored on server, not client
- Most secure option
- Use for: Highly sensitive data

---

## Migration Path (Mock → Real Backend)

### Step 1: Backend Ready
Backend API is deployed and accessible at `https://api.schedulepro.com`

### Step 2: Update Environment Variable
```env
VITE_API_BASE_URL=https://api.schedulepro.com/api
```

### Step 3: Switch Off Mock Mode
In `src/services/api.js`:
```javascript
const USE_MOCK_API = false; // Changed from true
```

### Step 4: Test Integration
1. Clear localStorage: `localStorage.clear()`
2. Refresh app
3. Test CRUD operations
4. Verify data persists in MySQL (via backend logs/database queries)

### Step 5: Remove Mock Code (Optional)
After successful integration, can remove:
- `src/services/mockData.js`
- `src/services/mockAuth.js` (keep if using for dev)
- Mock initialization logic

---

## Debugging localStorage

### View All Data
```javascript
// In browser console
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}
```

### Clear Specific Key
```javascript
localStorage.removeItem('mock_people')
```

### Clear All Data
```javascript
localStorage.clear()
```

### Check Storage Size
```javascript
const total = Object.keys(localStorage).reduce((acc, key) => {
  return acc + localStorage.getItem(key).length;
}, 0);
console.log(`Total localStorage size: ${(total / 1024).toFixed(2)} KB`);
```

---

## Summary

**Current State (Development):**
- localStorage serves as a **fake database** for development
- Allows frontend development without waiting for backend
- Data persists across page refreshes for convenient testing

**Future State (Production):**
- localStorage will **NOT** store application data
- MySQL database (via backend API) will store all people, vehicles, equipment, bookings
- localStorage will **only** store auth tokens and user preferences

**Key Takeaway:**
> localStorage is a temporary solution for mocking the backend during development. In production, it plays a supporting role (tokens, preferences) while MySQL handles the real data.

---

*Document Version: 1.0*
*Created: January 2026*
*Related Files: `src/services/mockData.js`, `src/services/api.js`*
