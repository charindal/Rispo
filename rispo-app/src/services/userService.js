import axios from './axiosConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const userService = {
  getUserProfile: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile/${userId}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch user profile';
    }
  },

  updateProfile: async (userId, profileData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile/${userId}`, profileData, {
        headers: getAuthHeader()
      });
      
      // Update local storage with new data
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        currentUser.email = response.data.email;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update profile';
    }
  }
};

export default userService;
