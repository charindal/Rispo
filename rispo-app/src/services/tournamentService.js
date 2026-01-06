import axios from 'axios';

const API_URL = 'http://localhost:8080';

const tournamentService = {
    // Admin functions
    createTournament: (tournamentData, userId) => {
        return axios.post(`${API_URL}/tournaments`, tournamentData, {
            headers: { 'X-User-Id': userId }
        });
    },

    updateTournament: (tournamentId, tournamentData, userId) => {
        return axios.put(`${API_URL}/tournaments/${tournamentId}`, tournamentData, {
            headers: { 'X-User-Id': userId }
        });
    },

    publishTournament: (tournamentId, userId) => {
        return axios.post(`${API_URL}/tournaments/${tournamentId}/publish`, {}, {
            headers: { 'X-User-Id': userId }
        });
    },

    deleteTournament: (tournamentId, userId) => {
        return axios.delete(`${API_URL}/tournaments/${tournamentId}`, {
            headers: { 'X-User-Id': userId }
        });
    },

    getAllTournaments: () => {
        return axios.get(`${API_URL}/tournaments`);
    },

    getPublishedTournaments: () => {
        return axios.get(`${API_URL}/tournaments/published`);
    },

    getTournamentById: (tournamentId) => {
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
