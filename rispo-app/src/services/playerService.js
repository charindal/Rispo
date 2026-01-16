import axios from './axiosConfig';

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
      // Trim search term and handle undefined
      const trimmedTerm = searchTerm && searchTerm.trim() ? searchTerm.trim() : '';
      
      // Log the parameters being sent for debugging
      console.log('Searching players with clubId:', clubId, 'searchTerm:', trimmedTerm);
      
      // If clubId is not available, use global search (searches all verified players)
      if (!clubId || clubId === 'undefined') {
        console.log('No clubId provided or undefined, using global search instead');
        const response = await axios.get(`${API_BASE_URL}/players/search/global`, {
          params: {
            name: trimmedTerm
          }
        });
        return response.data || [];
      }
      
      // Use club-specific search endpoint
      console.log('Using club search endpoint');
      const response = await axios.get(`${API_BASE_URL}/players/search`, {
        params: {
          clubId: clubId,
          searchTerm: trimmedTerm
        }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error searching players:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      
      // If we get a 400, try global search as fallback
      if (error.response?.status === 400) {
        console.log('Club search failed with 400, trying global search as fallback...');
        try {
          const trimmedTerm = searchTerm && searchTerm.trim() ? searchTerm.trim() : '';
          const fallbackResponse = await axios.get(`${API_BASE_URL}/players/search/global`, {
            params: {
              name: trimmedTerm
            }
          });
          return fallbackResponse.data || [];
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
          return [];
        }
      }
      
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
