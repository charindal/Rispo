import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.userId) {
    return { 'X-User-Id': user.userId };
  }
  return {};
};

const matchService = {
  submitMatch: async (matchData, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/matches`, matchData, {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to submit match';
    }
  },

  reviewMatch: async (matchId, reviewData, userId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/matches/${matchId}/review`,
        reviewData,
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to review match';
    }
  },

  getPendingMatches: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/pending`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending matches:', error);
      return [];
    }
  },

  getPlayerMatches: async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/player/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player matches:', error);
      return [];
    }
  },

  getMatch: async (matchId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to fetch match';
    }
  }
};

export default matchService;
