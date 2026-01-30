import axios from 'axios';
import mockApi from './mockData';

const USE_MOCK_API = true; // Toggle to switch between mock and real API

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

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could redirect to login
      console.warn('Unauthorized - token may be invalid');
    }
    return Promise.reject(error);
  }
);

// Wrapper that switches between mock and real API
const apiWrapper = {
  get: (url, config) => USE_MOCK_API ? handleMockRequest('GET', url) : api.get(url, config),
  post: (url, data, config) => USE_MOCK_API ? handleMockRequest('POST', url, data) : api.post(url, data, config),
  put: (url, data, config) => USE_MOCK_API ? handleMockRequest('PUT', url, data) : api.put(url, data, config),
  delete: (url, config) => USE_MOCK_API ? handleMockRequest('DELETE', url) : api.delete(url, config),
};

// Handle mock API requests
function handleMockRequest(method, url, data) {
  // Parse URL to determine endpoint
  // Remove /api/ prefix if present
  const cleanUrl = url.replace(/^\/api\//, '');
  const parts = cleanUrl.split('/').filter(p => p);

  // People endpoints
  if (parts[0] === 'people') {
    if (!parts[1]) {
      // /api/people
      return method === 'GET' ? mockApi.getPeople() : mockApi.createPerson(data);
    } else if (parts[2] === 'restore') {
      // /api/people/:id/restore
      return mockApi.undeletePerson(parts[1]);
    } else {
      // /api/people/:id
      if (method === 'GET') return mockApi.getPerson(parts[1]);
      if (method === 'PUT') return mockApi.updatePerson(parts[1], data);
      if (method === 'DELETE') return mockApi.deletePerson(parts[1]);
    }
  }

  // Vehicles endpoints
  if (parts[0] === 'vehicles') {
    if (!parts[1]) {
      return method === 'GET' ? mockApi.getVehicles() : mockApi.createVehicle(data);
    } else if (parts[2] === 'restore') {
      return mockApi.undeleteVehicle(parts[1]);
    } else {
      if (method === 'GET') return mockApi.getVehicle(parts[1]);
      if (method === 'PUT') return mockApi.updateVehicle(parts[1], data);
      if (method === 'DELETE') return mockApi.deleteVehicle(parts[1]);
    }
  }

  // Equipment endpoints
  if (parts[0] === 'equipment') {
    if (!parts[1]) {
      return method === 'GET' ? mockApi.getEquipment() : mockApi.createEquipment(data);
    } else if (parts[2] === 'restore') {
      return mockApi.undeleteEquipment(parts[1]);
    } else {
      if (method === 'GET') return mockApi.getEquipmentItem(parts[1]);
      if (method === 'PUT') return mockApi.updateEquipment(parts[1], data);
      if (method === 'DELETE') return mockApi.deleteEquipment(parts[1]);
    }
  }

  // Bookings endpoints
  if (parts[0] === 'bookings') {
    if (!parts[1]) {
      return method === 'GET' ? mockApi.getBookings() : mockApi.createBooking(data);
    } else if (parts[2] === 'restore') {
      return mockApi.undeleteBooking(parts[1]);
    } else {
      if (method === 'GET') return mockApi.getBooking(parts[1]);
      if (method === 'PUT') return mockApi.updateBooking(parts[1], data);
      if (method === 'DELETE') return mockApi.deleteBooking(parts[1]);
    }
  }

  return Promise.reject(new Error(`Mock endpoint not found: ${method} ${url}`));
}

export default apiWrapper;
