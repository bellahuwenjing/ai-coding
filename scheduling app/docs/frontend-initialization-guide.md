# Frontend Initialization & Integration Guide
## SchedulePro React + Vite + Backbone.js

---

## Overview

This guide covers the initialization of the frontend project using Vite + React, integration with Backbone.js, and environment configuration.

---

## 1. Project Initialization

### Prerequisites

- Node.js 18+ installed
- npm 9+ or yarn installed
- Backend API running at `http://localhost:8080` (optional for initial setup)

---

### Step 1: Create Vite + React Project

```bash
# Navigate to frontend directory
cd schpro-frontend

# Create Vite project with React template
npm create vite@latest . -- --template react

# Answer prompts:
# - Package name: schedulepro-frontend
# - Framework: React
# - Variant: JavaScript (or TypeScript if preferred)
```

**What this does:**
- Creates a Vite project with React pre-configured
- Sets up modern build tooling (ESM, HMR, fast dev server)
- Includes React 18+ with optimized development experience

---

### Step 2: Install Core Dependencies

```bash
# Install project dependencies
npm install

# Install Backbone.js and its dependencies
npm install backbone underscore

# Install Axios for HTTP requests
npm install axios

# Install Tailwind CSS for styling
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
npx tailwindcss init -p
```

**Dependency explanations:**
- **backbone**: Data models, collections, and routing
- **underscore**: Backbone.js dependency (utility library)
- **axios**: HTTP client for API requests (replaces jQuery.ajax)
- **tailwindcss**: Utility-first CSS framework
- **postcss** & **autoprefixer**: CSS processing tools for Tailwind

---

### Step 3: Configure Tailwind CSS

**Edit `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
```

**Edit `src/index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

---

### Step 4: Configure Environment Variables

**Create `.env.example` file:**

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Development Mode
VITE_DEV_MODE=true

# App Configuration
VITE_APP_NAME=SchedulePro
```

**Create `.env` file (copy from .env.example):**

```bash
cp .env.example .env
```

**Important notes about Vite environment variables:**
- Must be prefixed with `VITE_` to be exposed to the client
- Accessible in code via `import.meta.env.VITE_API_BASE_URL`
- `.env` should be added to `.gitignore`
- `.env.example` should be committed to version control

**Update `.gitignore` to exclude `.env`:**

```gitignore
# Existing entries...

# Environment variables
.env
.env.local
.env.*.local
```

---

### Step 5: Configure Vite

**Edit `vite.config.js`:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['backbone', 'underscore', 'axios']
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'backbone': ['backbone', 'underscore']
        }
      }
    }
  }
})
```

**Configuration explanations:**
- **server.port**: Development server runs on port 5173
- **server.proxy**: Proxies `/api` requests to backend (avoids CORS issues in dev)
- **optimizeDeps**: Pre-bundles Backbone.js and dependencies for faster dev server
- **build.rollupOptions**: Code splitting for better caching (vendor + backbone chunks)

---

### Step 6: Start Development Server

```bash
# Start Vite development server
npm run dev

# Server will run at http://localhost:5173
```

**Expected output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## 2. Vite + Backbone.js Integration

### Why This Works

**Vite uses native ES modules**, which means:
- ✅ Backbone.js works without modification (it's an ES module package)
- ✅ No special webpack loaders or plugins needed
- ✅ Fast development experience with instant HMR
- ✅ Tree-shaking for smaller production bundles

**Key integration points:**
1. Import Backbone.js as an ES module
2. Override `Backbone.sync` to use Axios instead of jQuery.ajax
3. Use React hooks to integrate Backbone models/collections with React components
4. Use Backbone.Router for client-side routing

---

### Step 1: Create Axios API Service

**Create `src/services/api.js`:**

```javascript
import axios from 'axios';

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor: Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Step 2: Override Backbone.sync

**Create `src/services/backboneSync.js`:**

```javascript
import Backbone from 'backbone';
import api from './api';

/**
 * Override Backbone.sync to use Axios instead of jQuery.ajax
 *
 * This allows Backbone models and collections to work with our
 * API service that includes authentication and error handling.
 */
const originalSync = Backbone.sync;

Backbone.sync = function(method, model, options = {}) {
  // Map Backbone methods to HTTP methods
  const methodMap = {
    create: 'post',
    read: 'get',
    update: 'put',
    patch: 'patch',
    delete: 'delete'
  };

  const httpMethod = methodMap[method];

  // Get URL from model or options
  const url = options.url || (typeof model.url === 'function' ? model.url() : model.url);

  if (!url) {
    throw new Error('A "url" property or function must be specified');
  }

  // Prepare request config
  const config = {
    method: httpMethod,
    url: url,
    ...options
  };

  // Add data for create/update/patch
  if (method === 'create' || method === 'update' || method === 'patch') {
    config.data = options.data || model.toJSON(options);
  }

  // Make Axios request
  return api(config)
    .then((response) => {
      // Call Backbone success callback
      if (options.success) {
        options.success(response.data);
      }
      return response.data;
    })
    .catch((error) => {
      // Call Backbone error callback
      if (options.error) {
        options.error(error);
      }
      throw error;
    });
};

export default Backbone.sync;
```

---

### Step 3: Create React-Backbone Integration Hooks

**Create `src/hooks/useBackboneModel.js`:**

```javascript
import { useState, useEffect } from 'react';

/**
 * React hook to integrate Backbone models with React components
 *
 * @param {Backbone.Model} model - Backbone model instance
 * @returns {Object} - { attributes, isSyncing, error, save, destroy }
 */
export function useBackboneModel(model) {
  const [attributes, setAttributes] = useState(model.toJSON());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen to model changes
    const handleChange = () => {
      setAttributes(model.toJSON());
    };

    const handleSync = () => {
      setIsSyncing(false);
      setError(null);
    };

    const handleError = (model, error) => {
      setIsSyncing(false);
      setError(error);
    };

    const handleRequest = () => {
      setIsSyncing(true);
    };

    // Attach listeners
    model.on('change', handleChange);
    model.on('sync', handleSync);
    model.on('error', handleError);
    model.on('request', handleRequest);

    // Cleanup on unmount
    return () => {
      model.off('change', handleChange);
      model.off('sync', handleSync);
      model.off('error', handleError);
      model.off('request', handleRequest);
    };
  }, [model]);

  // Wrapper methods
  const save = (attrs, options) => {
    return model.save(attrs, options);
  };

  const destroy = (options) => {
    return model.destroy(options);
  };

  return {
    attributes,
    isSyncing,
    error,
    save,
    destroy,
  };
}
```

**Create `src/hooks/useBackboneCollection.js`:**

```javascript
import { useState, useEffect } from 'react';

/**
 * React hook to integrate Backbone collections with React components
 *
 * @param {Backbone.Collection} collection - Backbone collection instance
 * @returns {Object} - { models, isFetching, error, fetch }
 */
export function useBackboneCollection(collection) {
  const [models, setModels] = useState(collection.models);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen to collection changes
    const handleUpdate = () => {
      setModels([...collection.models]);
    };

    const handleSync = () => {
      setIsFetching(false);
      setError(null);
    };

    const handleError = (collection, error) => {
      setIsFetching(false);
      setError(error);
    };

    const handleRequest = () => {
      setIsFetching(true);
    };

    // Attach listeners
    collection.on('add remove reset change sort', handleUpdate);
    collection.on('sync', handleSync);
    collection.on('error', handleError);
    collection.on('request', handleRequest);

    // Cleanup on unmount
    return () => {
      collection.off('add remove reset change sort', handleUpdate);
      collection.off('sync', handleSync);
      collection.off('error', handleError);
      collection.off('request', handleRequest);
    };
  }, [collection]);

  // Wrapper method
  const fetch = (options) => {
    return collection.fetch(options);
  };

  return {
    models,
    isFetching,
    error,
    fetch,
  };
}
```

---

### Step 4: Initialize Backbone in Main Entry

**Edit `src/main.jsx`:**

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import Backbone from 'backbone'
import App from './App.jsx'
import './index.css'

// Import Backbone.sync override (must be imported before any models/collections)
import './services/backboneSync.js'

// Start Backbone history for routing
Backbone.history.start({ pushState: true });

// Render React app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

### Step 5: Example Backbone Model Usage in React

**Create `src/models/Person.js`:**

```javascript
import Backbone from 'backbone';

const Person = Backbone.Model.extend({
  urlRoot: '/api/people',

  defaults: {
    name: '',
    email: '',
    role: 'member',
    phone: '',
    skills: [],
    is_deleted: false,
  },

  // Helper methods
  isAdmin() {
    return this.get('role') === 'admin';
  },

  isMember() {
    return this.get('role') === 'member';
  },

  isAssignable() {
    return this.isMember() && !this.get('is_deleted');
  },

  // Validation
  validate(attrs) {
    const errors = {};

    if (!attrs.name || attrs.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!attrs.email || attrs.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attrs.email)) {
      errors.email = 'Invalid email format';
    }

    if (Object.keys(errors).length > 0) {
      return errors;
    }
  }
});

export default Person;
```

**Example React component using Person model:**

```javascript
import React, { useEffect } from 'react';
import { useBackboneModel } from '../hooks/useBackboneModel';
import Person from '../models/Person';

function PersonDetail({ personId }) {
  const person = new Person({ id: personId });
  const { attributes, isSyncing, error, save } = useBackboneModel(person);

  useEffect(() => {
    person.fetch();
  }, [personId]);

  const handleSave = () => {
    save({ name: 'Updated Name' });
  };

  if (isSyncing) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>{attributes.name}</h2>
      <p>Email: {attributes.email}</p>
      <p>Role: {attributes.role}</p>
      <button onClick={handleSave}>Update Name</button>
    </div>
  );
}

export default PersonDetail;
```

---

## 3. Verification Steps

### Verify Installation

```bash
# Check that all dependencies are installed
npm list backbone underscore axios

# Expected output:
# schedulepro-frontend@0.0.0
# ├── axios@1.6.0
# ├── backbone@1.4.1
# └── underscore@1.13.6
```

### Verify Dev Server

```bash
# Start dev server
npm run dev

# Visit http://localhost:5173 in browser
# Should see Vite + React welcome page
```

### Verify Backbone Integration

**Create a test model and fetch data:**

```javascript
// In browser console:
import Backbone from 'backbone';
const TestModel = Backbone.Model.extend({ url: '/api/test' });
const test = new TestModel();
test.fetch(); // Should use Axios and include auth token
```

### Verify Environment Variables

```javascript
// In browser console or component:
console.log(import.meta.env.VITE_API_BASE_URL);
// Expected: "http://localhost:8080/api"

console.log(import.meta.env.VITE_DEV_MODE);
// Expected: "true"
```

---

## 4. Troubleshooting

### Issue: "Backbone is not defined"

**Solution:** Make sure to import Backbone before using it:

```javascript
import Backbone from 'backbone';
```

---

### Issue: API requests fail with CORS errors

**Solutions:**
1. **Use Vite proxy** (already configured in `vite.config.js`):
   - Requests to `/api` are proxied to backend
   - No CORS issues in development

2. **Enable CORS in backend** (see backend PRD Section 13.0):
   - Configure `app/Filters/Cors.php` in CodeIgniter

---

### Issue: Environment variables are undefined

**Solutions:**
1. Ensure variable names start with `VITE_`
2. Restart dev server after changing `.env`
3. Access via `import.meta.env.VITE_VARIABLE_NAME` (not `process.env`)

---

### Issue: Backbone models not re-rendering React components

**Solution:** Use the `useBackboneModel` or `useBackboneCollection` hooks - they listen to Backbone events and trigger React re-renders automatically.

---

### Issue: HMR (Hot Module Replacement) not working

**Solutions:**
1. Ensure you're using React Fast Refresh (included in `@vitejs/plugin-react`)
2. Check browser console for HMR connection errors
3. Restart dev server: `npm run dev`

---

## 5. Next Steps

After initialization and verification:

1. **Create project structure** (Phase 1.2 of frontend implementation plan):
   - `src/components/`, `src/models/`, `src/collections/`, etc.

2. **Implement Backbone models and collections** (Phase 2):
   - Person, Vehicle, Equipment, Booking models
   - Corresponding collections with filters

3. **Build authentication system** (Phase 3):
   - Login form
   - Token management
   - Protected routes

4. **Follow frontend implementation plan** step-by-step

---

## 6. Build for Production

### Create Production Build

```bash
# Create optimized production build
npm run build

# Output will be in dist/ directory
```

### Preview Production Build

```bash
# Preview production build locally
npm run preview

# Server will run at http://localhost:4173
```

### Deploy Production Build

The `dist/` directory contains static files that can be deployed to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Copy `dist/` contents to `gh-pages` branch
- **Traditional hosting**: Upload `dist/` contents to web server

**Important:** Update `.env` for production:

```env
VITE_API_BASE_URL=https://api.yourproduction.com/api
VITE_DEV_MODE=false
```

---

## Summary

✅ **Vite + React** provides fast development experience with instant HMR
✅ **Backbone.js** works seamlessly with Vite as an ES module
✅ **Axios override** replaces jQuery.ajax for Backbone.sync
✅ **React hooks** bridge Backbone models/collections with React components
✅ **Environment variables** configure API endpoints and app settings
✅ **No special configuration needed** - Backbone.js works out of the box

**Total setup time:** ~15-30 minutes

---

*Guide Version: 1.0*
*Created: January 2026*
*Compatible with: Vite 5.x, React 18.x, Backbone 1.4.x*
