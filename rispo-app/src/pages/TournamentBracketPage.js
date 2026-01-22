import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import clubService from '../services/clubService';
import authService from '../services/authService';
import '../styles/TournamentBracketPage.css';

const TournamentBracketPage = () => {
    const { clubId, tournamentId } = useParams();
    const navigate = useNavigate();
    const [bracket, setBracket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isClubAdmin, setIsClubAdmin] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        if (!currentUser?.userId) {
            setError('Please log in to view the bracket');
            setLoading(false);
            return;
        }
        loadBracket();
        checkClubAdmin();
    }, [tournamentId, clubId]);

    const checkClubAdmin = async () => {
        if (!clubId || clubId === 'undefined' || !currentUser?.userId) return;
        try {
            const clubData = await clubService.getClubDetails(clubId);
            const isAdmin = clubData.members?.some(m => 
                m.userId === currentUser.userId && m.role === 'ADMIN'
            );
            setIsClubAdmin(isAdmin);
        } catch (err) {
            console.error('Error checking club admin status:', err);
        }
    };

    const loadBracket = async () => {
        try {
            setLoading(true);
            let response;
            
            console.log('Loading bracket - clubId:', clubId, 'tournamentId:', tournamentId);
            
            if (clubId && clubId !== 'undefined') {
                // This is a knockout tournament from a club
                console.log('Using knockout tournament API');
                response = await tournamentService.getKnockoutTournamentBracket(clubId, tournamentId);
            } else {
                // This is a regular tournament bracket
                console.log('Using regular tournament bracket API');
                response = await tournamentService.getKnockoutBracket(tournamentId);
            }
            
            setBracket(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load bracket');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePairings = async () => {
        if (!window.confirm('Generate first round pairings? This will create the bracket based on approved players.')) {
            return;
        }
        try {
            setActionLoading(true);
            await clubService.generateFirstRoundPairings(clubId, tournamentId, currentUser.userId);
            await loadBracket();
            alert('Round 1 pairings generated successfully!');
        } catch (err) {
            alert('Error generating pairings: ' + (err.message || err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegenerateRound1 = async () => {
        if (!window.confirm('Regenerate Round 1 pairings? This will create new matchups for all approved players. Use this if players have joined or left since the last draw.')) {
            return;
        }
        try {
            setActionLoading(true);
            await clubService.regenerateFirstRoundPairings(clubId, tournamentId, currentUser.userId);
            await loadBracket();
            alert('Round 1 pairings regenerated successfully!');
        } catch (err) {
            alert('Error regenerating pairings: ' + (err.message || err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getRoundName = (round) => {
        if (!bracket?.roundNames) return `Round ${round}`;
        return bracket.roundNames[round] || `Round ${round}`;
    };

    const getMatchClassName = (match) => {
        let className = 'bracket-match';
        if (match.status === 'APPROVED') className += ' completed';
        if (match.isBye) className += ' bye-match';
        return className;
    };

    const getPlayerClassName = (match, playerNum) => {
        let className = 'bracket-player';
        const player = playerNum === 1 ? match.player1 : match.player2;
        
        if (!player) return className + ' bye';
        
        if (match.winner) {
            if (match.winner.playerId === player.playerId) {
                className += ' winner';
            } else {
                className += ' loser';
            }
        }
        
        return className;
    };

    const renderMatch = (match) => {
        return (
            <div key={match.matchId} className={getMatchClassName(match)}>
                <div className={getPlayerClassName(match, 1)}>
                    <span className="player-name">
                        {match.player1?.name || 'TBD'}
                        {match.player1?.isLuckyLoser && <span className="lucky-loser-badge" title="Lucky Loser">LL</span>}
                    </span>
                    <span className="player-score">
                        {match.status === 'APPROVED' ? match.player1Games : '-'}
                    </span>
                    {match.status === 'APPROVED' && match.player1?.ratingChange !== null && (
                        <span className={`rating-change ${match.player1?.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                            {match.player1?.ratingChange >= 0 ? '+' : ''}{match.player1?.ratingChange}
                        </span>
                    )}
                </div>
                <div className="match-connector">
                    <span className="vs-label">vs</span>
                </div>
                <div className={getPlayerClassName(match, 2)}>
                    <span className="player-name">
                        {match.isBye ? 'BYE' : (match.player2?.name || 'TBD')}
                        {match.player2?.isLuckyLoser && !match.isBye && <span className="lucky-loser-badge" title="Lucky Loser">LL</span>}
                    </span>
                    <span className="player-score">
                        {match.isBye ? '-' : (match.status === 'APPROVED' ? match.player2Games : '-')}
                    </span>
                    {match.status === 'APPROVED' && match.player2?.ratingChange !== null && !match.isBye && (
                        <span className={`rating-change ${match.player2?.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                            {match.player2?.ratingChange >= 0 ? '+' : ''}{match.player2?.ratingChange}
                        </span>
                    )}
                </div>
                {match.status === 'PENDING_REVIEW' && (
                    <div className="match-status pending">Pending</div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="tournament-bracket-page"><p>Loading bracket...</p></div>;
    }

    if (error) {
        return (
            <div className="tournament-bracket-page">
                <div className="nav-header">
                    <div className="nav-left">
                        <h2>Tournament Bracket</h2>
                    </div>
                    <div className="nav-right">
                        <button onClick={() => navigate('/player-dashboard')} className="nav-btn">🏠 Home</button>
                    </div>
                </div>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    const rounds = bracket?.rounds || {};
    const sortedRounds = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    return (
        <div className="tournament-bracket-page">
            <div className="nav-header">
                <div className="nav-left">
                    <h2>{bracket?.tournamentName} - Bracket</h2>
                    <span className="tournament-status">{bracket?.status}</span>
                </div>
                <div className="nav-right">
                    <button onClick={() => navigate('/player-dashboard')} className="nav-btn">🏠 Dashboard</button>
                    <button onClick={() => navigate('/rankings')} className="nav-btn">Rankings</button>
                    <button onClick={() => navigate('/profile')} className="nav-btn">Profile</button>
                    <button onClick={() => navigate(clubId && clubId !== 'undefined' ? `/club/${clubId}/tournament-matches/${tournamentId}` : `/tournament-matches/${tournamentId}`)} className="nav-btn">Matches</button>
                    <button onClick={() => navigate(clubId && clubId !== 'undefined' ? `/club/${clubId}/tournament-standings/${tournamentId}` : `/tournament-standings/${tournamentId}`)} className="nav-btn">Standings</button>
                    <button onClick={handleLogout} className="nav-btn logout-btn">Sign Out</button>
                </div>
            </div>

            {bracket?.champion && (
                <div className="champion-banner">
                    <span className="champion-trophy">🏆</span>
                    <div className="champion-info">
                        <span className="champion-label">Tournament Champion</span>
                        <span className="champion-name">{bracket.champion.name}</span>
                    </div>
                    <span className="champion-trophy">🏆</span>
                </div>
            )}

            {/* Admin Controls for Round 1 Management */}
            {isClubAdmin && clubId && clubId !== 'undefined' && (
                <div className="admin-controls" style={{
                    background: '#f5f5f5',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#666' }}>🔧 Admin:</span>
                    
                    {/* Show Generate button if round 1 not yet generated */}
                    {!bracket?.round1Generated && (
                        <button 
                            onClick={handleGeneratePairings}
                            disabled={actionLoading}
                            style={{
                                background: '#4caf50',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading ? 0.7 : 1
                            }}
                        >
                            {actionLoading ? '⏳ Generating...' : '🎲 Generate Round 1 Pairings'}
                        </button>
                    )}
                    
                    {/* Show Regenerate button if round 1 generated but not started */}
                    {bracket?.round1Generated && bracket?.allowRound1Regenerate && !bracket?.round1Started && (
                        <button 
                            onClick={handleRegenerateRound1}
                            disabled={actionLoading}
                            style={{
                                background: '#ff9800',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                opacity: actionLoading ? 0.7 : 1
                            }}
                        >
                            {actionLoading ? '⏳ Regenerating...' : '🔄 Regenerate Round 1'}
                        </button>
                    )}
                    
                    {bracket?.round1Generated && bracket?.allowRound1Regenerate && !bracket?.round1Started && (
                        <span style={{ color: '#666', fontSize: '14px' }}>
                            ℹ️ You can regenerate pairings until the first match result is entered.
                        </span>
                    )}
                    
                    {bracket?.round1Started && (
                        <span style={{ color: '#4caf50', fontSize: '14px' }}>
                            ✅ Round 1 has started - pairings are locked.
                        </span>
                    )}
                </div>
            )}

            <div className="bracket-container">
                <div className="bracket-scroll">
                    <div className="bracket-wrapper">
                        {sortedRounds.map((round) => (
                            <div key={round} className="bracket-round">
                                <div className="round-header">
                                    <h3>{getRoundName(round)}</h3>
                                    <span className="match-count">{rounds[round]?.length || 0} match(es)</span>
                                </div>
                                <div className="round-matches">
                                    {rounds[round]?.map(match => renderMatch(match))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bracket-legend">
                <h4>Legend</h4>
                <div className="legend-items">
                    <span className="legend-item">
                        <span className="legend-color winner"></span> Winner
                    </span>
                    <span className="legend-item">
                        <span className="legend-color loser"></span> Eliminated
                    </span>
                    <span className="legend-item">
                        <span className="legend-color pending"></span> Pending
                    </span>
                    <span className="legend-item">
                        <span className="legend-color bye"></span> Bye
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TournamentBracketPage;
