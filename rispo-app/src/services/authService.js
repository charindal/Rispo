import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const authService = {
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  isAuthenticated: () => {
    return localStorage.getItem('user') !== null;
  },

  changePassword: async (userId, passwordData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/change-password/${userId}`, passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to change password';
    }
  }
};

export default authService;
