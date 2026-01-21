import axios from './axiosConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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

  // Search clubs by name, city, or suburb
  searchClubs: async (name, city, suburb) => {
    try {
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (city) params.append('city', city);
      if (suburb) params.append('suburb', suburb);
      
      const response = await axios.get(`${API_BASE_URL}/clubs/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching clubs:', error);
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

  // Update club details (system admin only)
  updateClub: async (clubId, clubData, userId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/clubs/${clubId}`, clubData, {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to update club';
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

  // Get my tokens (for SYSTEM_ADMIN)
  getMyTokens: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/tokens/my-tokens`, {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my tokens:', error);
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

  // Get player's join request history (all statuses)
  getPlayerJoinRequestHistory: async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/join-requests/player/${playerId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player join request history:', error);
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
  },

  // Get club by ID
  getClubById: async (clubId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/${clubId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to get club details';
    }
  },

  // Get club members (implement when backend endpoint is ready)
  getClubMembers: async (clubId) => {
    try {
      // Use the existing search endpoint to get players by club
      const response = await axios.get(`${API_BASE_URL}/players/search?clubId=${clubId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching club members:', error);
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  },

  // Get club tournaments
  getClubTournaments: async (clubId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/${clubId}/tournaments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching club tournaments:', error);
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  },

  // Knockout Tournament Methods
  getClubKnockoutTournaments: async (clubId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/${clubId}/knockout-tournaments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching knockout tournaments:', error);
      return [];
    }
  },

  createWeeklyKnockoutTournament: async (clubId, userId, drawType = 'RANDOM') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/clubs/${clubId}/knockout-tournaments/weekly?drawType=${drawType}`,
        {},
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to create tournament';
    }
  },

  createKnockoutTournament: async (clubId, userId, options = {}) => {
    try {
      const { drawType = 'RANDOM', tournamentName = '', tournamentType = 'WEEKLY' } = options;
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('drawType', drawType);
      if (tournamentName.trim()) {
        params.append('tournamentName', tournamentName.trim());
      }
      params.append('tournamentType', tournamentType);
      
      const response = await axios.post(
        `${API_BASE_URL}/clubs/${clubId}/knockout-tournaments?${params.toString()}`,
        {},
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to create tournament';
    }
  },

  startKnockoutTournament: async (clubId, tournamentId, userId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/clubs/${clubId}/knockout-tournaments/${tournamentId}/start`,
        {},
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to start tournament';
    }
  },

  updateKnockoutMatchResult: async (clubId, tournamentId, matchId, resultData, userId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/clubs/${clubId}/knockout-tournaments/${tournamentId}/matches/${matchId}/result`,
        resultData,
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to update match result';
    }
  },

  getClubTournamentLeaderboard: async (clubId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/${clubId}/tournament-leaderboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tournament leaderboard:', error);
      return [];
    }
  },

  updateTournamentPointsConfig: async (clubId, pointsConfig, userId) => {
    try {
      // Map frontend field names to backend expected field names
      const backendConfig = {
        winnerPoints: pointsConfig.winner,
        runnerUpPoints: pointsConfig.runnerUp,
        semifinalistPoints: pointsConfig.semifinalist,
        quarterfinalistPoints: pointsConfig.quarterfinalist
      };
      
      const response = await axios.put(
        `${API_BASE_URL}/clubs/${clubId}/tournament-points-config`,
        backendConfig,
        { headers: { 'X-User-Id': userId } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message || 'Failed to update points configuration';
    }
  },

  getTournamentPointsConfig: async (clubId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clubs/${clubId}/tournament-points-config`);
      const data = response.data;
      // Map backend field names to frontend expected field names
      return {
        winner: data.winnerPoints || 5,
        runnerUp: data.runnerUpPoints || 3,
        semifinalist: data.semifinalistPoints || 2,
        quarterfinalist: data.quarterfinalistPoints || 1
      };
    } catch (error) {
      console.error('Error fetching points configuration:', error);
      return { winner: 5, runnerUp: 3, semifinalist: 2, quarterfinalist: 1 };
    }
  },

  // Review club join request
  reviewClubJoinRequest: async (requestId, status, reviewNotes, userId) => {
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
  }
};

export default clubService;
