import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import authService from '../services/authService';
import playerService from '../services/playerService';
import '../styles/FormCard.css';

const TournamentsPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [myTournaments, setMyTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my-tournaments'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [playerClubId, setPlayerClubId] = useState(null);

    const currentUser = authService.getCurrentUser();
    const playerId = currentUser?.playerId;

    // Fetch player's club ID on mount
    useEffect(() => {
        const fetchPlayerClub = async () => {
            if (playerId) {
                try {
                    const response = await playerService.getPlayer(playerId);
                    if (response && response.clubId) {
                        setPlayerClubId(response.clubId);
                    }
                } catch (err) {
                    console.error('Failed to fetch player club:', err);
                }
            }
        };
        fetchPlayerClub();
    }, [playerId]);

    useEffect(() => {
        // Clear errors when switching tabs
        setError('');
        setMessage('');
        
        if (activeTab === 'available') {
            loadTournaments();
        } else {
            loadMyTournaments();
        }
    }, [activeTab, playerClubId]);

    const loadTournaments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await tournamentService.getPublishedTournaments();
            // Filter tournaments: show open tournaments (no club) OR tournaments for player's club
            const availableTournaments = response.data.filter(tournament => {
                // No club = open to everyone
                if (!tournament.clubId) {
                    return true;
                }
                // Club-affiliated = only show if player belongs to that club
                return playerClubId && tournament.clubId === playerClubId;
            });
            setTournaments(availableTournaments);
        } catch (err) {
            console.error('Failed to load tournaments:', err);
            setError('Failed to load tournaments');
        } finally {
            setLoading(false);
        }
    };

    const loadMyTournaments = async () => {
        if (!playerId) {
            setError('You must be logged in as a player to view your tournaments');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            // Get all tournaments and filter for player's participations
            const allTournamentsResponse = await tournamentService.getAllTournaments();
            const playerTournaments = [];
            
            // For each tournament, check if player has joined
            for (const tournament of allTournamentsResponse.data) {
                try {
                    const playersResponse = await tournamentService.getTournamentPlayers(tournament.tournamentId);
                    const playerParticipation = playersResponse.data.find(p => p.playerId === parseInt(playerId));
                    
                    if (playerParticipation) {
                        playerTournaments.push({
                            ...tournament,
                            participationStatus: playerParticipation.status,
                            requestedAt: playerParticipation.requestedAt
                        });
                    }
                } catch (err) {
                    console.error('Error checking tournament:', err);
                }
            }
            
            setMyTournaments(playerTournaments);
        } catch (err) {
            setError('Failed to load your tournaments');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawFromTournament = async (tournamentId) => {
        if (!window.confirm('Are you sure you want to withdraw from this tournament?')) {
            return;
        }

        setMessage('');
        setError('');

        try {
            // There's no withdraw endpoint, so we'd need to add one or use reject
            setError('Withdrawal feature coming soon. Please contact an administrator.');
            // TODO: Implement withdrawal endpoint in backend
        } catch (err) {
            setError(err.response?.data || 'Failed to withdraw from tournament');
        }
    };

    const handleJoinTournament = async (tournamentId) => {
        if (!playerId) {
            setError('You must be logged in as a player to join a tournament');
            return;
        }

        setMessage('');
        setError('');

        try {
            await tournamentService.joinTournament(tournamentId, playerId);
            setMessage('Join request submitted successfully! Wait for admin approval.');
            loadTournaments();
        } catch (err) {
            setError(err.response?.data || 'Failed to join tournament');
        }
    };

    const handleViewDetails = async (tournament) => {
        try {
            const [tournamentRes, playersRes] = await Promise.all([
                tournamentService.getTournamentById(tournament.tournamentId),
                tournamentService.getTournamentPlayers(tournament.tournamentId)
            ]);
            
            setSelectedTournament({
                ...tournamentRes.data,
                players: playersRes.data
            });
        } catch (err) {
            setError('Failed to load tournament details');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            PUBLISHED: 'blue',
            ONGOING: 'green',
            COMPLETED: 'purple',
            PENDING: 'orange',
            APPROVED: 'green',
            REJECTED: 'red'
        };
        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: colors[status] || 'gray',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
                {status}
            </span>
        );
    };

    const isTournamentFull = (tournament) => {
        return tournament.maxParticipants && tournament.currentParticipants >= tournament.maxParticipants;
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading tournaments...</div>;
    }

    return (
        <div style={{ padding: '0', maxWidth: '100%', margin: '0' }}>
            {/* Navigation Bar */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 30px',
                backgroundColor: '#2c3e50',
                color: 'white',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>🏆 Tournaments</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/player-dashboard')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🏠 Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        👤 Profile
                    </button>
                    <button
                        onClick={() => { authService.logout(); navigate('/login'); }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Tournaments</h1>

            {/* Tab Navigation */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                borderBottom: '2px solid #dee2e6', 
                marginBottom: '20px' 
            }}>
                <button
                    onClick={() => setActiveTab('available')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'available' ? '#007bff' : 'transparent',
                        color: activeTab === 'available' ? 'white' : '#007bff',
                        border: 'none',
                        borderBottom: activeTab === 'available' ? '3px solid #007bff' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}
                >
                    Available Tournaments
                </button>
                <button
                    onClick={() => setActiveTab('my-tournaments')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'my-tournaments' ? '#007bff' : 'transparent',
                        color: activeTab === 'my-tournaments' ? 'white' : '#007bff',
                        border: 'none',
                        borderBottom: activeTab === 'my-tournaments' ? '3px solid #007bff' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}
                >
                    My Tournaments
                </button>
            </div>

            {message && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', marginBottom: '20px', borderRadius: '4px' }}>{message}</div>}
            {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}

            {selectedTournament ? (
                <div>
                    <button 
                        onClick={() => setSelectedTournament(null)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '20px'
                        }}
                    >
                        ← Back to Tournaments
                    </button>

                    <div className="form-card">
                        <h2>{selectedTournament.name}</h2>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <div><strong>Status:</strong> {getStatusBadge(selectedTournament.status)}</div>
                                <div><strong>Dates:</strong> {selectedTournament.startDate} to {selectedTournament.endDate}</div>
                                <div><strong>Participants:</strong> {selectedTournament.currentParticipants}{selectedTournament.maxParticipants ? `/${selectedTournament.maxParticipants}` : ''}</div>
                            </div>
                            
                            {selectedTournament.venue && (
                                <div style={{ marginBottom: '10px' }}><strong>Venue:</strong> {selectedTournament.venue}</div>
                            )}
                            
                            {selectedTournament.club && (
                                <div style={{ marginBottom: '10px' }}><strong>Club:</strong> {selectedTournament.club.clubName}</div>
                            )}
                            
                            {selectedTournament.description && (
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Description:</strong>
                                    <p style={{ marginTop: '5px', color: '#6c757d' }}>{selectedTournament.description}</p>
                                </div>
                            )}
                            
                            {selectedTournament.rules && (
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Rules:</strong>
                                    <p style={{ marginTop: '5px', color: '#6c757d', whiteSpace: 'pre-line' }}>{selectedTournament.rules}</p>
                                </div>
                            )}
                        </div>

                        {selectedTournament.status === 'PUBLISHED' && (
                            <button 
                                onClick={() => handleJoinTournament(selectedTournament.tournamentId)}
                                disabled={isTournamentFull(selectedTournament)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: isTournamentFull(selectedTournament) ? '#6c757d' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isTournamentFull(selectedTournament) ? 'not-allowed' : 'pointer',
                                    marginBottom: '30px'
                                }}
                            >
                                {isTournamentFull(selectedTournament) ? 'Tournament Full' : 'Join Tournament'}
                            </button>
                        )}

                        <h3>Approved Participants ({selectedTournament.players.filter(p => p.status === 'APPROVED').length})</h3>
                        {selectedTournament.players.filter(p => p.status === 'APPROVED').length === 0 ? (
                            <p style={{ color: '#6c757d' }}>No approved participants yet.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Player</th>
                                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Rating</th>
                                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTournament.players
                                        .filter(p => p.status === 'APPROVED')
                                        .sort((a, b) => (b.playerRating || 0) - (a.playerRating || 0))
                                        .map((player, index) => (
                                            <tr key={player.playerId}>
                                                <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                                    {index + 1}. <strong>{player.playerName}</strong>
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                    {player.playerRating || 'Unrated'}
                                                </td>
                                                <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                                    {new Date(player.respondedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    {activeTab === 'available' ? (
                        // Available Tournaments Tab
                        tournaments.length === 0 ? (
                            <p style={{ color: '#6c757d', fontSize: '18px', textAlign: 'center', marginTop: '50px' }}>
                                No tournaments available at the moment. Check back later!
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '30px' }}>
                                {tournaments.map(tournament => (
                                    <div 
                                        key={tournament.tournamentId}
                                        className="form-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleViewDetails(tournament)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0 }}>{tournament.name}</h3>
                                            {getStatusBadge(tournament.status)}
                                        </div>
                                        
                                        {tournament.description && (
                                            <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '15px' }}>
                                                {tournament.description.substring(0, 100)}
                                                {tournament.description.length > 100 ? '...' : ''}
                                            </p>
                                        )}
                                        
                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                            <strong>📅 Dates:</strong> {tournament.startDate} to {tournament.endDate}
                                        </div>
                                        
                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                            <strong>🎯 Format:</strong> <span style={{ 
                                                fontWeight: 'bold',
                                                color: tournament.format === 'KNOCKOUT' ? '#e83e8c' : 
                                                       tournament.format === 'ROUND_ROBIN' ? '#28a745' : '#17a2b8'
                                            }}>
                                                {tournament.format === 'KNOCKOUT' ? 'Knockout' : 
                                                 tournament.format === 'ROUND_ROBIN' ? 'Round Robin' : 'Swiss System'}
                                            </span>
                                        </div>
                                        
                                        {tournament.venue && (
                                            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                                <strong>📍 Venue:</strong> {tournament.venue}
                                            </div>
                                        )}
                                        
                                        {tournament.club && (
                                            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                                <strong>🏛️ Club:</strong> {tournament.club.clubName}
                                            </div>
                                        )}
                                        
                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '15px' }}>
                                            <strong>👥 Participants:</strong> {tournament.currentParticipants}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}
                                            {isTournamentFull(tournament) && <span style={{ color: '#dc3545', marginLeft: '10px' }}>FULL</span>}
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(tournament);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            View Details & Join
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // My Tournaments Tab
                        myTournaments.length === 0 ? (
                            <p style={{ color: '#6c757d', fontSize: '18px', textAlign: 'center', marginTop: '50px' }}>
                                You haven't joined any tournaments yet.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '30px' }}>
                                {myTournaments.map(tournament => (
                                    <div 
                                        key={tournament.tournamentId}
                                        className="form-card"
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0 }}>{tournament.name}</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                                {getStatusBadge(tournament.status)}
                                                {getStatusBadge(tournament.participationStatus)}
                                            </div>
                                        </div>
                                        
                                        {tournament.description && (
                                            <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '15px' }}>
                                                {tournament.description.substring(0, 100)}
                                                {tournament.description.length > 100 ? '...' : ''}
                                            </p>
                                        )}
                                        
                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                            <strong>📅 Dates:</strong> {tournament.startDate} to {tournament.endDate}
                                        </div>
                                        
                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                            <strong>🎯 Format:</strong> <span style={{ 
                                                fontWeight: 'bold',
                                                color: tournament.format === 'KNOCKOUT' ? '#e83e8c' : 
                                                       tournament.format === 'ROUND_ROBIN' ? '#28a745' : '#17a2b8'
                                            }}>
                                                {tournament.format === 'KNOCKOUT' ? 'Knockout' : 
                                                 tournament.format === 'ROUND_ROBIN' ? 'Round Robin' : 'Swiss System'}
                                            </span>
                                        </div>
                                        
                                        {tournament.venue && (
                                            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                                <strong>📍 Venue:</strong> {tournament.venue}
                                            </div>
                                        )}
                                        
                                        {tournament.club && (
                                            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                                <strong>🏛️ Club:</strong> {tournament.club.clubName}
                                            </div>
                                        )}
                                        
                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                                            <strong>👥 Participants:</strong> {tournament.currentParticipants}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}
                                        </div>

                                        <div style={{ fontSize: '14px', color: '#495057', marginBottom: '15px' }}>
                                            <strong>⏰ Requested:</strong> {new Date(tournament.requestedAt).toLocaleDateString()}
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <button 
                                                onClick={() => handleViewDetails(tournament)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    minWidth: '100px'
                                                }}
                                            >
                                                View Details
                                            </button>
                                            
                                            {tournament.participationStatus === 'APPROVED' && (tournament.status === 'ONGOING' || tournament.status === 'COMPLETED' || tournament.status === 'CLOSED') && (
                                                <button 
                                                    onClick={() => navigate(`/tournament-matches/${tournament.tournamentId}`)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        backgroundColor: '#17a2b8',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        minWidth: '80px'
                                                    }}
                                                >
                                                    Matches
                                                </button>
                                            )}
                                            
                                            {tournament.participationStatus === 'APPROVED' && tournament.format === 'KNOCKOUT' && (tournament.status === 'ONGOING' || tournament.status === 'COMPLETED' || tournament.status === 'CLOSED') && (
                                                <button 
                                                    onClick={() => navigate(`/tournament-bracket/${tournament.tournamentId}`)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        backgroundColor: '#e83e8c',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        minWidth: '80px'
                                                    }}
                                                >
                                                    🏆 Bracket
                                                </button>
                                            )}
                                            
                                            {tournament.participationStatus === 'APPROVED' && tournament.status === 'PUBLISHED' && (
                                                <button 
                                                    onClick={() => handleWithdrawFromTournament(tournament.tournamentId)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        minWidth: '80px'
                                                    }}
                                                >
                                                    Withdraw
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

export default TournamentsPage;
