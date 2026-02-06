/**
 * Mock Authentication Service
 *
 * Provides a hard-coded user and token for development without backend
 */

// Mock user data
const MOCK_USER = {
  id: 1,
  company_id: 1,
  name: 'Admin User',
  email: 'admin@demo.com',
  role: 'admin',
};

// Mock JWT token (not a real JWT, just a placeholder)
const MOCK_TOKEN = 'mock-jwt-token-12345';

/**
 * Initialize mock authentication
 * Stores mock token and user in localStorage
 */
export function initMockAuth() {
  localStorage.setItem('auth_token', MOCK_TOKEN);
  localStorage.setItem('current_user', JSON.stringify(MOCK_USER));
}

/**
 * Get current mock user
 */
export function getCurrentUser() {
  const userJson = localStorage.getItem('current_user');
  return userJson ? JSON.parse(userJson) : MOCK_USER;
}

/**
 * Get mock token
 */
export function getToken() {
  return localStorage.getItem('auth_token') || MOCK_TOKEN;
}

/**
 * Check if user is admin
 */
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

/**
 * Logout (clear mock data)
 */
export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
}

// Auto-initialize on import (DISABLED - using real auth now)
// initMockAuth();

export default {
  initMockAuth,
  getCurrentUser,
  getToken,
  isAdmin,
  logout,
  MOCK_USER,
};
