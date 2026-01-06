import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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
  }
};

export default playerService;
