import axios from './axiosConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const ratingService = {
  getSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rating-settings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rating settings:', error);
      throw error.response?.data?.message || error.message || 'Failed to fetch settings';
    }
  },

  updateSettings: async (settingsData, userId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/rating-settings`,
        settingsData,
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to update settings';
    }
  }
};

export default ratingService;
