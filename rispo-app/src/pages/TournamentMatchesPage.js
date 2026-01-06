import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import matchService from '../services/matchService';
import authService from '../services/authService';
import '../styles/TournamentMatchesPage.css';

const TournamentMatchesPage = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [currentRound, setCurrentRound] = useState(1);
    const [maxRound, setMaxRound] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resultInputs, setResultInputs] = useState({});
    
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.userId;
    const isAdmin = currentUser?.roles?.some(role => 
        ['SUPER_USER', 'SYSTEM_ADMIN', 'CLUB_ADMIN', 'RATING_ADMIN'].includes(role)
    );

    useEffect(() => {
        if (!userId) {
            setError('Please log in to view tournament matches');
            setLoading(false);
            return;
        }
        loadTournamentData();
    }, [tournamentId, userId]);

    const loadTournamentData = async () => {
        try {
            setLoading(true);
            const tournamentRes = await tournamentService.getTournamentById(tournamentId);
            setTournament(tournamentRes.data);
            await loadMatches();
        } catch (err) {
            setError('Failed to load tournament data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadMatches = async () => {
        try {
            const matchesRes = await tournamentService.getTournamentMatches(tournamentId);
            const allMatches = matchesRes.data || [];
            setMatches(allMatches);
            
            // Find max round
            if (allMatches.length > 0) {
                const maxR = Math.max(...allMatches.map(m => m.round || 1));
                setMaxRound(maxR);
            }
        } catch (err) {
            console.error('Failed to load matches:', err);
        }
    };

    const getRoundMatches = () => {
        return matches.filter(m => m.round === currentRound);
    };

    const handleInputChange = (matchId, field, value) => {
        setResultInputs(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [field]: value
            }
        }));
    };

    const handleSubmitResult = async (matchId) => {
        const input = resultInputs[matchId];
        if (!input || !input.player1Games === undefined || input.player2Games === undefined) {
            setError('Please enter game scores for both players');
            return;
        }

        try {
            setError('');
            const match = matches.find(m => m.matchId === matchId);
            
            // Determine winner based on games
            let winnerId = null;
            if (input.player1Games > input.player2Games) {
                winnerId = match.player1?.id;
            } else if (input.player2Games > input.player1Games) {
                winnerId = match.player2?.id;
            }
            // null winner means draw

            const matchData = {
                player1Id: match.player1?.id,
                player2Id: match.player2?.id,
                player1Games: parseInt(input.player1Games),
                player2Games: parseInt(input.player2Games),
                winnerId: winnerId,
                tournamentId: parseInt(tournamentId)
            };

            await matchService.submitMatch(matchData, userId);
            setSuccessMessage('Result submitted successfully');
            await loadMatches();
            
            // Clear input
            setResultInputs(prev => {
                const newInputs = { ...prev };
                delete newInputs[matchId];
                return newInputs;
            });
        } catch (err) {
            setError(err.message || 'Failed to submit result');
        }
    };

    const handleApproveMatch = async (matchId) => {
        try {
            setError('');
            await matchService.reviewMatch(matchId, { approved: true }, userId);
            setSuccessMessage('Match approved and ratings updated');
            await loadMatches();
        } catch (err) {
            setError(err.message || 'Failed to approve match');
        }
    };

    const handleRejectMatch = async (matchId) => {
        try {
            setError('');
            await matchService.reviewMatch(matchId, { approved: false }, userId);
            setSuccessMessage('Match rejected');
            await loadMatches();
        } catch (err) {
            setError(err.message || 'Failed to reject match');
        }
    };

    const handleGenerateNextRound = async () => {
        try {
            setError('');
            const nextRound = maxRound + 1;
            await tournamentService.generateTournamentMatches(tournamentId, nextRound, userId);
            setSuccessMessage(`Round ${nextRound} matches generated successfully`);
            await loadMatches();
            setCurrentRound(nextRound);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate next round');
        }
    };

    const isRoundComplete = () => {
        const roundMatches = getRoundMatches();
        return roundMatches.length > 0 && roundMatches.every(m => m.status === 'APPROVED');
    };

    const getMatchStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING': return { text: 'Awaiting Result', class: 'status-pending' };
            case 'SUBMITTED': return { text: 'Submitted - Awaiting Review', class: 'status-submitted' };
            case 'APPROVED': return { text: 'Approved', class: 'status-approved' };
            case 'REJECTED': return { text: 'Rejected', class: 'status-rejected' };
            default: return { text: status, class: '' };
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="tournament-matches-page"><p>Loading...</p></div>;
    }

    return (
        <div className="tournament-matches-page">
            <div className="nav-header">
                <div className="nav-left">
                    <h2>{tournament?.name} - Matches</h2>
                </div>
                <div className="nav-right">
                    <button onClick={() => navigate('/admin')} className="nav-btn">Dashboard</button>
                    <button onClick={() => navigate('/profile')} className="nav-btn">Profile</button>
                    <button onClick={() => navigate(`/tournament-standings/${tournamentId}`)} className="nav-btn">Standings</button>
                    <button onClick={handleLogout} className="nav-btn logout-btn">Sign Out</button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="round-navigation">
                <button 
                    onClick={() => setCurrentRound(prev => Math.max(1, prev - 1))}
                    disabled={currentRound <= 1}
                    className="round-btn"
                >
                    ← Previous Round
                </button>
                <span className="round-indicator">Round {currentRound} of {maxRound}</span>
                <button 
                    onClick={() => setCurrentRound(prev => Math.min(maxRound, prev + 1))}
                    disabled={currentRound >= maxRound}
                    className="round-btn"
                >
                    Next Round →
                </button>
            </div>

            {isAdmin && isRoundComplete() && (
                <div className="generate-round-section">
                    <p>All matches in Round {currentRound} are complete!</p>
                    <button onClick={handleGenerateNextRound} className="generate-btn">
                        Generate Round {maxRound + 1} Matches
                    </button>
                </div>
            )}

            <div className="matches-list">
                {getRoundMatches().length === 0 ? (
                    <p className="no-matches">No matches in this round yet.</p>
                ) : (
                    getRoundMatches().map(match => {
                        const statusDisplay = getMatchStatusDisplay(match.status);
                        return (
                            <div key={match.matchId} className={`match-card ${statusDisplay.class}`}>
                                <div className="match-header">
                                    <span className="match-id">Match #{match.matchId}</span>
                                    <span className={`match-status ${statusDisplay.class}`}>{statusDisplay.text}</span>
                                </div>
                                
                                <div className="match-players">
                                    <div className={`player ${match.winnerId === match.player1?.id ? 'winner' : ''}`}>
                                        <span className="player-name">{match.player1?.name || 'TBD'}</span>
                                        <span className="player-rating">({match.player1?.rating || '-'})</span>
                                        {match.status === 'APPROVED' && match.player1RatingChange !== null && (
                                            <span className={`rating-change ${match.player1RatingChange >= 0 ? 'positive' : 'negative'}`}>
                                                {match.player1RatingChange >= 0 ? '+' : ''}{match.player1RatingChange}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="vs">
                                        {match.status !== 'PENDING' ? (
                                            <span className="score">{match.player1Games} - {match.player2Games}</span>
                                        ) : (
                                            <span>VS</span>
                                        )}
                                    </div>
                                    
                                    <div className={`player ${match.winnerId === match.player2?.id ? 'winner' : ''}`}>
                                        <span className="player-name">{match.player2?.name || 'TBD'}</span>
                                        <span className="player-rating">({match.player2?.rating || '-'})</span>
                                        {match.status === 'APPROVED' && match.player2RatingChange !== null && (
                                            <span className={`rating-change ${match.player2RatingChange >= 0 ? 'positive' : 'negative'}`}>
                                                {match.player2RatingChange >= 0 ? '+' : ''}{match.player2RatingChange}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Input for pending matches */}
                                {isAdmin && match.status === 'PENDING' && (
                                    <div className="result-input">
                                        <div className="input-row">
                                            <label>{match.player1?.name} Games:</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={resultInputs[match.matchId]?.player1Games || ''}
                                                onChange={(e) => handleInputChange(match.matchId, 'player1Games', e.target.value)}
                                            />
                                        </div>
                                        <div className="input-row">
                                            <label>{match.player2?.name} Games:</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={resultInputs[match.matchId]?.player2Games || ''}
                                                onChange={(e) => handleInputChange(match.matchId, 'player2Games', e.target.value)}
                                            />
                                        </div>
                                        <button onClick={() => handleSubmitResult(match.matchId)} className="submit-btn">
                                            Submit Result
                                        </button>
                                    </div>
                                )}

                                {/* Approval buttons for submitted matches */}
                                {isAdmin && match.status === 'SUBMITTED' && (
                                    <div className="review-buttons">
                                        <button onClick={() => handleApproveMatch(match.matchId)} className="approve-btn">
                                            Approve & Rate
                                        </button>
                                        <button onClick={() => handleRejectMatch(match.matchId)} className="reject-btn">
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {match.status === 'APPROVED' && match.winnerId && (
                                    <div className="match-result">
                                        Winner: {match.winnerId === match.player1?.id ? match.player1?.name : match.player2?.name}
                                    </div>
                                )}
                                {match.status === 'APPROVED' && !match.winnerId && (
                                    <div className="match-result draw">Draw</div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TournamentMatchesPage;
