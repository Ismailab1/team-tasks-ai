import authService from './authService';

// Base URL for API requests
const BASE_URL = '/api';

// API client for making authenticated requests
const apiClient = {
  async get(endpoint: string) {
    return this.request(endpoint, 'GET');
  },

  async post(endpoint: string, data: any) {
    return this.request(endpoint, 'POST', data);
  },

  async put(endpoint: string, data: any) {
    return this.request(endpoint, 'PUT', data);
  },

  async delete(endpoint: string) {
    return this.request(endpoint, 'DELETE');
  },

  // Generic request function
  async request(endpoint: string, method: string, data: any = null) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token
    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 401 (token expired)
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Your session has expired. Please log in again.');
      }
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Something went wrong');
      }
      
      return responseData;
    } catch (error) {
      console.error(`API error (${method} ${endpoint}):`, error);
      throw error;
    }
  }
};

export default apiClient;