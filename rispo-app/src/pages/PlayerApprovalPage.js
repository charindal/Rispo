import React, { useState, useEffect } from 'react';
import clubService from '../services/clubService';
import authService from '../services/authService';
import '../styles/PlayerApprovalPage.css';

const PlayerApprovalPage = ({ clubId, tournamentId, tournamentName, onClose }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [canRegenerateRound1, setCanRegenerateRound1] = useState(false);

    const user = authService.getCurrentUser();

    useEffect(() => {
        loadPlayersForApproval();
    }, [tournamentId]);

    const loadPlayersForApproval = async () => {
        try {
            setLoading(true);
            const response = await clubService.getTournamentPlayersForApproval(clubId, tournamentId);
            setPlayers(response);
        } catch (err) {
            setError('Failed to load players: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePlayer = async (playerId) => {
        try {
            setError('');
            await clubService.approvePlayerForTournament(clubId, tournamentId, playerId, user.userId);
            setSuccessMessage('Player approved successfully!');
            loadPlayersForApproval();
        } catch (err) {
            setError('Failed to approve player: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleRejectPlayer = async (playerId) => {
        if (!rejectReason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }
        
        try {
            setError('');
            await clubService.rejectPlayerForTournament(clubId, tournamentId, playerId, rejectReason, user.userId);
            setSuccessMessage('Player rejected successfully!');
            setShowRejectModal(null);
            setRejectReason('');
            loadPlayersForApproval();
        } catch (err) {
            setError('Failed to reject player: ' + (err.response?.data?.message || err.message));
        }
    };

    const getApprovedCount = () => {
        return players.filter(p => p.approvalStatus === 'APPROVED').length;
    };

    const getPendingCount = () => {
        return players.filter(p => p.approvalStatus === 'PENDING').length;
    };

    const getRejectedCount = () => {
        return players.filter(p => p.approvalStatus === 'REJECTED').length;
    };

    const getApprovalStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#4caf50';
            case 'REJECTED': return '#f44336';
            case 'PENDING': return '#ff9800';
            default: return '#999';
        }
    };

    const getApprovalStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return '✓';
            case 'REJECTED': return '✗';
            case 'PENDING': return '⏳';
            default: return '?';
        }
    };

    if (loading) {
        return <div className="player-approval-loading">Loading players...</div>;
    }

    return (
        <div className="player-approval-container">
            <div className="approval-header">
                <h2>Weekly Tournament - Payment Approval</h2>
                <div className="header-subtitle">
                    <p>{tournamentName}</p>
                    <small>Approve players once payment has been received</small>
                </div>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="approval-stats">
                <div className="stat-card approved">
                    <div className="stat-value">{getApprovedCount()}</div>
                    <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-value">{getPendingCount()}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-value">{getRejectedCount()}</div>
                    <div className="stat-label">Rejected</div>
                </div>
                <div className="stat-card total">
                    <div className="stat-value">{players.length}</div>
                    <div className="stat-label">Total Players</div>
                </div>
            </div>

            <div className="players-list">
                {players.map(player => (
                    <div key={player.playerId} className={`player-card approval-${player.approvalStatus.toLowerCase()}`}>
                        <div className="player-info">
                            <div className="player-name">{player.playerName}</div>
                            <div className="player-rating">Rating: {player.rating}</div>
                        </div>

                        <div className="approval-status">
                            <span 
                                className="status-badge"
                                style={{ backgroundColor: getApprovalStatusColor(player.approvalStatus) }}
                            >
                                {getApprovalStatusIcon(player.approvalStatus)} {player.approvalStatus}
                            </span>
                        </div>

                        {player.approvalStatus === 'PENDING' && (
                            <div className="player-actions">
                                <button
                                    onClick={() => handleApprovePlayer(player.playerId)}
                                    className="btn-approve"
                                    title="Click after payment received"
                                >
                                    ✓ Confirm Payment
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(player.playerId)}
                                    className="btn-reject"
                                    title="Mark player as not participating"
                                >
                                    ✗ Not Participating
                                </button>
                            </div>
                        )}

                        {player.approvalStatus === 'APPROVED' && (
                            <div className="player-actions">
                                <button
                                    onClick={() => setShowRejectModal(player.playerId)}
                                    className="btn-revoke"
                                    title="Cancel player participation"
                                >
                                    Remove Player
                                </button>
                            </div>
                        )}

                        {player.approvalStatus === 'REJECTED' && (
                            <div className="player-actions">
                                <div className="rejection-reason">
                                    <strong>Status:</strong> {player.rejectionReason || 'N/A'}
                                </div>
                                <button
                                    onClick={() => handleApprovePlayer(player.playerId)}
                                    className="btn-reconsider"
                                    title="Player now wants to participate"
                                >
                                    Approve Payment
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showRejectModal && (
                <div className="rejection-modal">
                    <h3>Player Status</h3>
                    <div className="modal-content">
                        <label>Note (optional):</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., 'Payment not received', 'Player cancelled'"
                            rows="4"
                        />
                    </div>
                    <div className="modal-actions">
                        <button
                            onClick={() => handleRejectPlayer(showRejectModal)}
                            className="btn-submit"
                        >
                            Mark Not Participating
                        </button>
                        <button
                            onClick={() => {
                                setShowRejectModal(null);
                                setRejectReason('');
                            }}
                            className="btn-cancel"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerApprovalPage;
