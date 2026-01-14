import axios from './axiosConfig';

const API_URL = process.env.REACT_APP_API_URL || '';

console.log('TOURNAMENT SERVICE - API_URL:', API_URL);

const tournamentService = {
    // Admin functions
    createTournament: (tournamentData, userId) => {
        console.log('Creating tournament:', tournamentData);
        return axios.post(`${API_URL}/tournaments`, tournamentData, {
            headers: { 'X-User-Id': userId }
        });
    },

    updateTournament: (tournamentId, tournamentData, userId) => {
        console.log('Updating tournament:', tournamentId);
        return axios.put(`${API_URL}/tournaments/${tournamentId}`, tournamentData, {
            headers: { 'X-User-Id': userId }
        });
    },

    publishTournament: (tournamentId, userId) => {
        console.log('Publishing tournament:', tournamentId);
        return axios.post(`${API_URL}/tournaments/${tournamentId}/publish`, {}, {
            headers: { 'X-User-Id': userId }
        });
    },

    deleteTournament: (tournamentId, userId) => {
        console.log('Deleting tournament:', tournamentId);
        return axios.delete(`${API_URL}/tournaments/${tournamentId}`, {
            headers: { 'X-User-Id': userId }
        });
    },

    getAllTournaments: () => {
        console.log('Fetching all tournaments from:', `${API_URL}/tournaments`);
        return axios.get(`${API_URL}/tournaments`);
    },

    getPublishedTournaments: () => {
        console.log('Fetching published tournaments from:', `${API_URL}/tournaments/published`);
        return axios.get(`${API_URL}/tournaments/published`)
            .then(response => {
                console.log('Published tournaments response:', response.data);
                return response;
            })
            .catch(error => {
                console.error('Error fetching published tournaments:', error);
                console.error('Error details:', error.response?.data);
                throw error;
            });
    },

    getTournamentById: (tournamentId) => {
        console.log('Fetching tournament by ID:', tournamentId);
        return axios.get(`${API_URL}/tournaments/${tournamentId}`);
    },

    // Player functions
    joinTournament: (tournamentId, playerId) => {
        return axios.post(`${API_URL}/tournaments/${tournamentId}/join`, {}, {
            headers: { 'X-Player-Id': playerId }
        });
    },

    // Admin approval functions
    approveJoinRequest: (tournamentId, playerId, adminUserId) => {
        return axios.post(
            `${API_URL}/tournaments/${tournamentId}/players/${playerId}/approve`,
            {},
            { headers: { 'X-User-Id': adminUserId } }
        );
    },

    rejectJoinRequest: (tournamentId, playerId, adminUserId) => {
        return axios.post(
            `${API_URL}/tournaments/${tournamentId}/players/${playerId}/reject`,
            {},
            { headers: { 'X-User-Id': adminUserId } }
        );
    },

    getTournamentPlayers: (tournamentId) => {
        return axios.get(`${API_URL}/tournaments/${tournamentId}/players`);
    },

    getTournamentPendingRequests: (tournamentId) => {
        return axios.get(`${API_URL}/tournaments/${tournamentId}/requests`);
    },

    generateTournamentMatches: (tournamentId, round, userId) => {
        const params = round ? `?round=${round}` : '';
        return axios.post(
            `${API_URL}/tournaments/${tournamentId}/generate-matches${params}`,
            {},
            { headers: { 'X-User-Id': userId } }
        );
    },

    getTournamentMatches: (tournamentId, round) => {
        const params = round ? `?round=${round}` : '';
        return axios.get(`${API_URL}/tournaments/${tournamentId}/matches${params}`);
    },

    getTournamentStandings: (tournamentId) => {
        return axios.get(`${API_URL}/tournaments/${tournamentId}/standings`);
    },

    getTournamentCrossTable: (tournamentId) => {
        return axios.get(`${API_URL}/tournaments/${tournamentId}/crosstable`);
    },

    getKnockoutBracket: (tournamentId) => {
        return axios.get(`${API_URL}/tournaments/${tournamentId}/bracket`);
    },

    updateMatchResult: (tournamentId, matchId, resultData, userId) => {
        return axios.put(
            `${API_URL}/tournaments/${tournamentId}/matches/${matchId}/result`,
            resultData,
            { headers: { 'X-User-Id': userId } }
        );
    },

    closeTournament: (tournamentId, userId) => {
        return axios.post(
            `${API_URL}/tournaments/${tournamentId}/close`,
            {},
            { headers: { 'X-User-Id': userId } }
        );
    }
};

export default tournamentService;
