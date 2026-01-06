import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import authService from '../services/authService';

const TournamentRequestsPage = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.userId;

    useEffect(() => {
        loadData();
    }, [tournamentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tournamentRes, pendingRes, playersRes] = await Promise.all([
                tournamentService.getTournamentById(tournamentId),
                tournamentService.getTournamentPendingRequests(tournamentId),
                tournamentService.getTournamentPlayers(tournamentId)
            ]);
            
            setTournament(tournamentRes.data);
            setPendingRequests(pendingRes.data);
            setAllPlayers(playersRes.data);
        } catch (err) {
            setError('Failed to load tournament data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (playerId) => {
        setMessage('');
        setError('');
        
        if (!userId) {
            setError('You must be logged in as an admin to approve requests');
            return;
        }
        
        try {
            await tournamentService.approveJoinRequest(tournamentId, playerId, userId);
            setMessage('Join request approved successfully');
            loadData();
        } catch (err) {
            console.error('Approve error:', err);
            setError(err.response?.data || err.message || 'Failed to approve request');
        }
    };

    const handleReject = async (playerId) => {
        setMessage('');
        setError('');
        
        if (!userId) {
            setError('You must be logged in as an admin to reject requests');
            return;
        }
        
        try {
            await tournamentService.rejectJoinRequest(tournamentId, playerId, userId);
            setMessage('Join request rejected');
            loadData();
        } catch (err) {
            setError(err.response?.data || 'Failed to reject request');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
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

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>📋 Tournament Requests</h2>
                    <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#e74c3c',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {currentUser?.role?.replace('_', ' ') || 'Admin'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/tournaments/manage')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🏆 Tournament Management
                    </button>
                    <button
                        onClick={() => navigate('/admin-dashboard')}
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
                        🏠 Admin Dashboard
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

            {tournament && (
                <div style={{ marginBottom: '30px' }}>
                    <h1>{tournament.name}</h1>
                    <p style={{ color: '#6c757d' }}>{tournament.description}</p>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        <div><strong>Dates:</strong> {tournament.startDate} to {tournament.endDate}</div>
                        <div><strong>Status:</strong> {getStatusBadge(tournament.status)}</div>
                        <div><strong>Participants:</strong> {tournament.currentParticipants}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}</div>
                    </div>
                </div>
            )}

            {message && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', marginBottom: '20px', borderRadius: '4px' }}>{message}</div>}
            {error && <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}

            <div style={{ marginBottom: '40px' }}>
                <h2>Pending Join Requests ({pendingRequests.length})</h2>
                {pendingRequests.length === 0 ? (
                    <p style={{ color: '#6c757d' }}>No pending requests.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Player</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Rating</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Requested At</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.map(request => (
                                <tr key={request.playerId}>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        <div><strong>{request.playerName}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#6c757d' }}>ID: {request.playerId}</div>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {request.playerRating || 'Unrated'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {new Date(request.requestedAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleApprove(request.playerId)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(request.playerId)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div>
                <h2>All Participants ({allPlayers.length})</h2>
                {allPlayers.length === 0 ? (
                    <p style={{ color: '#6c757d' }}>No participants yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Player</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Rating</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Requested At</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Responded At</th>
                                <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Responded By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPlayers.map(player => (
                                <tr key={player.playerId}>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        <div><strong>{player.playerName}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#6c757d' }}>ID: {player.playerId}</div>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {player.playerRating || 'Unrated'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {getStatusBadge(player.status)}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {new Date(player.requestedAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                        {player.respondedAt ? new Date(player.respondedAt).toLocaleString() : '-'}
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                                        {player.respondedByUsername || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            </div>
        </div>
    );
};

export default TournamentRequestsPage;
