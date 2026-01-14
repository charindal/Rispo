import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Log the API URL for debugging (especially important for mobile apps)
console.log('AUTH SERVICE - API_BASE_URL:', API_BASE_URL);
console.log('AUTH SERVICE - Environment:', process.env.NODE_ENV);

const authService = {
  register: async (userData) => {
    try {
      console.log('Attempting registration to:', `${API_BASE_URL}/auth/register`);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      console.log('Registration successful');
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  login: async (username, password) => {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      console.log('Username:', username);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      console.log('Login response received:', response.status);
      console.log('Login response data keys:', Object.keys(response.data));
      console.log('Has token:', !!response.data.token);
      
      if (response.data.token) {
        console.log('Token received, saving to localStorage');
        const userDataToStore = JSON.stringify(response.data);
        localStorage.setItem('user', userDataToStore);
        
        // Verify it was saved
        const savedData = localStorage.getItem('user');
        console.log('Verified saved data exists:', !!savedData);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          console.log('Verified token in saved data:', !!parsed.token);
        }
      } else {
        console.error('❌ No token in login response!');
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      
      // Better error messages for network issues
      if (!error.response) {
        if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
          throw `Network error: Cannot connect to server at ${API_BASE_URL}. Please check your internet connection and ensure the backend server is running.`;
        }
        throw `Connection error: ${error.message}`;
      }
      
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
