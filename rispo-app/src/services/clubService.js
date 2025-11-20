import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const clubService = {
  // Get all active clubs
  getActiveClubs: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active clubs:', error);
      // Return empty array if endpoint fails
      return [];
    }
  },

  // Get all clubs (admin only)
  getAllClubs: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all clubs:', error);
      return [];
    }
  },

  // Create a new club (system admin only)
  createClub: async (clubData, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/clubs`, clubData, {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to create club';
    }
  },

  // Generate admin token (system admin only)
  generateToken: async (tokenData, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/clubs/tokens`, tokenData, {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to generate token';
    }
  },

  // Get unused tokens
  getUnusedTokens: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/tokens/unused`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unused tokens:', error);
      return [];
    }
  },

  // Request to join a club
  requestToJoinClub: async (clubId, message, playerId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/clubs/join-requests`, 
        { clubId, message },
        { headers: { 'X-Player-Id': playerId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to submit join request';
    }
  },

  // Get player's join requests
  getPlayerJoinRequests: async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/join-requests/player/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player join requests:', error);
      return [];
    }
  },

  // Get club's join requests (admin)
  getClubJoinRequests: async (clubId, status = null) => {
    try {
      const url = status 
        ? `${API_BASE_URL}/clubs/${clubId}/join-requests?status=${status}`
        : `${API_BASE_URL}/clubs/${clubId}/join-requests`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching club join requests:', error);
      return [];
    }
  },

  // Get all pending join requests (admin)
  getPendingJoinRequests: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/join-requests/pending`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending join requests:', error);
      return [];
    }
  },

  // Review join request (admin)
  reviewJoinRequest: async (requestId, status, reviewNotes, userId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/clubs/join-requests/${requestId}`,
        { status, reviewNotes },
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to review join request';
    }
  },

  // Update club status (system admin only)
  updateClubStatus: async (clubId, status, userId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/clubs/${clubId}/status?status=${status}`,
        {},
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to update club status';
    }
  }
};

export default clubService;
