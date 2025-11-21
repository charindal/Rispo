import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const getAuthHeader = (userId) => {
  return userId ? { 'X-User-Id': userId } : {};
};

const challengeService = {
  // Create a challenge
  createChallenge: async (challengeData, userId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/challenges`,
        challengeData,
        { headers: getAuthHeader(userId) }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to create challenge';
    }
  },

  // Get incoming challenges (challenges received by current player)
  getIncomingChallenges: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/challenges/incoming`, {
        headers: getAuthHeader(userId)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming challenges:', error);
      return [];
    }
  },

  // Get outgoing challenges (challenges sent by current player)
  getOutgoingChallenges: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/challenges/outgoing`, {
        headers: getAuthHeader(userId)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching outgoing challenges:', error);
      return [];
    }
  },

  // Respond to a challenge
  respondToChallenge: async (challengeId, response, userId) => {
    try {
      const endpoint = response === 'ACCEPTED' 
        ? `${API_BASE_URL}/challenges/${challengeId}/accept`
        : `${API_BASE_URL}/challenges/${challengeId}/reject`;
      
      const result = await axios.patch(
        endpoint,
        {},
        { headers: getAuthHeader(userId) }
      );
      return result.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to respond to challenge';
    }
  },

  // Cancel a challenge
  cancelChallenge: async (challengeId, userId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/challenges/${challengeId}/cancel`,
        {},
        { headers: getAuthHeader(userId) }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to cancel challenge';
    }
  },

  // Get player flags
  getPlayerFlags: async (playerId, userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/challenges/flags/player/${playerId}`,
        { headers: getAuthHeader(userId) }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching player flags:', error);
      return [];
    }
  },

  // Get unresolved flags (for admins)
  getUnresolvedFlags: async (userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/challenges/flags/unresolved`,
        { headers: getAuthHeader(userId) }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unresolved flags:', error);
      return [];
    }
  }
};

export default challengeService;
