import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const playerService = {
  // Get a single player by ID
  getPlayer: async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player:', error);
      return null;
    }
  },

  // Search players by club (fast, indexed search)
  searchPlayersByClub: async (clubId, searchTerm = '') => {
    try {
      const params = new URLSearchParams({ clubId });
      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/players/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  },

  // Get all players
  getAllPlayers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players`);
      return response.data;
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  },

  // Get top 10 player rankings
  getTop10Rankings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players/rankings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }
  },

  // Get a player's ranking by ID
  getPlayerRanking: async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players/${playerId}/ranking`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player ranking:', error);
      throw error;
    }
  },

  // Search player rankings
  searchPlayerRankings: async (searchTerm) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/players/rankings/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error searching player rankings:', error);
      return [];
    }
  }
};

export default playerService;
