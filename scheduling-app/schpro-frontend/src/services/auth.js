import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance for auth (no interceptors needed for login/register)
const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Auth Service - Handles authentication with backend
 */
const authService = {
  /**
   * Register new user and company
   */
  async register(companyName, name, email, password) {
    try {
      const response = await authApi.post('/auth/register', {
        company_name: companyName,
        name,
        email,
        password
      });

      if (response.data.status === 'success') {
        const { access_token, refresh_token } = response.data.data.session;
        const { profile } = response.data.data;

        // Store tokens
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(profile));

        return {
          success: true,
          user: profile,
          token: access_token
        };
      }

      return {
        success: false,
        error: response.data.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  },

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await authApi.post('/auth/login', {
        email,
        password
      });

      if (response.data.status === 'success') {
        const { access_token, refresh_token } = response.data.data.session;
        const { profile } = response.data.data;

        // Store tokens
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(profile));

        return {
          success: true,
          user: profile,
          token: access_token
        };
      }

      return {
        success: false,
        error: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Call backend logout endpoint
        await authApi.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('auth_token');
  },

  /**
   * Check if user is admin
   * For MVP: All authenticated users are admin
   */
  isAdmin() {
    return this.isAuthenticated();
  }
};

export default authService;
