import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import clubService from '../services/clubService';
import authService from '../services/authService';
import '../styles/TournamentStandingsPage.css';

const TournamentStandingsPage = () => {
    const { tournamentId, clubId } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [standings, setStandings] = useState([]);
    const [crossTable, setCrossTable] = useState(null);
    const [activeTab, setActiveTab] = useState('standings');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const currentUser = authService.getCurrentUser();
    const isKnockoutTournament = !!clubId;

    useEffect(() => {
        if (!currentUser?.userId) {
            setError('Please log in to view tournament standings');
            setLoading(false);
            return;
        }
        loadData();
    }, [tournamentId, clubId]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            if (isKnockoutTournament && clubId && clubId !== 'undefined') {
                // Load knockout tournament data
                const [tournamentRes, leaderboardRes] = await Promise.all([
                    tournamentService.getKnockoutTournamentBracket(clubId, tournamentId),
                    clubService.getClubTournamentLeaderboard(clubId)
                ]);
                
                // Create tournament-like object from bracket data
                const bracketData = tournamentRes.data;
                setTournament({
                    id: bracketData.tournamentId,
                    name: bracketData.tournamentName,
                    status: bracketData.status,
                    format: "KNOCKOUT",
                    isKnockout: true
                });
                setStandings(leaderboardRes.data || []);
                setCrossTable(null); // Knockout tournaments don't have cross tables
            } else {
                // Load regular tournament data
                const [tournamentRes, standingsRes, crossTableRes] = await Promise.all([
                    tournamentService.getTournamentById(tournamentId),
                    tournamentService.getTournamentStandings(tournamentId),
                    tournamentService.getTournamentCrossTable(tournamentId)
                ]);
                
                setTournament({ ...tournamentRes.data, isKnockout: false });
                setStandings(standingsRes.data || []);
                setCrossTable(crossTableRes.data);
            }
        } catch (err) {
            setError('Failed to load tournament data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getResultDisplay = (result) => {
        if (result === 'X') return { text: 'X', class: 'self' };
        if (result === '-') return { text: '-', class: 'not-played' };
        if (typeof result === 'object') {
            const display = {
                'W': { text: '1', class: 'win' },
                'L': { text: '0', class: 'loss' },
                'D': { text: '½', class: 'draw' }
            };
            return display[result.result] || { text: '?', class: '' };
        }
        return { text: result, class: '' };
    };

    if (loading) {
        return <div className="tournament-standings-page"><p>Loading...</p></div>;
    }

    return (
        <div className="tournament-standings-page">
            <div className="nav-header">
                <div className="nav-left">
                    <h2>{tournament?.name} - Results</h2>
                </div>
                <div className="nav-right">
                    <button onClick={() => navigate('/player-dashboard')} className="nav-btn">🏠 Home</button>
                    <button onClick={() => navigate('/profile')} className="nav-btn">Profile</button>
                    <button 
                        onClick={() => isKnockoutTournament ? 
                            navigate(`/club/${clubId}/tournament-matches/${tournamentId}`) : 
                            navigate(`/tournament-matches/${tournamentId}`)
                        } 
                        className="nav-btn">
                        Matches
                    </button>
                    {tournament?.format === 'KNOCKOUT' && (
                        <button 
                            onClick={() => isKnockoutTournament ?
                                navigate(`/club/${clubId}/tournament-bracket/${tournamentId}`) :
                                navigate(`/tournament-bracket/${tournamentId}`)
                            } 
                            className="nav-btn bracket-btn">
                            🏆 Bracket
                        </button>
                    )}
                    <button onClick={handleLogout} className="nav-btn logout-btn">Sign Out</button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'standings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('standings')}
                >
                    Standings
                </button>
                {tournament?.format !== 'KNOCKOUT' && (
                    <button 
                        className={`tab-btn ${activeTab === 'crosstable' ? 'active' : ''}`}
                        onClick={() => setActiveTab('crosstable')}
                    >
                        Cross Table
                    </button>
                )}
                {tournament?.format === 'KNOCKOUT' && (
                    <button 
                        className={`tab-btn ${activeTab === 'bracket' ? 'active' : ''}`}
                        onClick={() => isKnockoutTournament ?
                            navigate(`/club/${clubId}/tournament-bracket/${tournamentId}`) :
                            navigate(`/tournament-bracket/${tournamentId}`)
                        }
                    >
                        Bracket View
                    </button>
                )}
            </div>

            {activeTab === 'standings' && (
                <div className="standings-container">
                    <table className="standings-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                {isKnockoutTournament ? (
                                    <>
                                        <th>Points</th>
                                        <th>Tournaments</th>
                                        <th>Wins</th>
                                        <th>Runner-up</th>
                                        <th>Semi-finals</th>
                                        <th>Quarter-finals</th>
                                    </>
                                ) : (
                                    <>
                                        <th>Played</th>
                                        <th>W</th>
                                        <th>D</th>
                                        <th>L</th>
                                        <th>Score</th>
                                        <th>Rating</th>
                                        <th>Change</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {standings.length === 0 ? (
                                <tr>
                                    <td colSpan={isKnockoutTournament ? "8" : "9"} className="no-data">
                                        {isKnockoutTournament ? 'No tournament data available' : 'No standings available yet'}
                                    </td>
                                </tr>
                            ) : (
                                standings.map((player, index) => (
                                    <tr key={player.playerId} className={isKnockoutTournament && player.rank <= 3 ? `top-${player.rank}` : (index < 3 ? `top-${index + 1}` : '')}>
                                        <td className="rank">
                                            {(isKnockoutTournament ? player.rank : (index + 1)) <= 3 && (
                                                <span className={`medal medal-${isKnockoutTournament ? player.rank : (index + 1)}`}>
                                                    {(isKnockoutTournament ? player.rank : (index + 1)) === 1 ? '🥇' : 
                                                     (isKnockoutTournament ? player.rank : (index + 1)) === 2 ? '🥈' : '🥉'}
                                                </span>
                                            )}
                                            {isKnockoutTournament ? player.rank : (index + 1)}
                                        </td>
                                        <td className="player-name">{player.playerName}</td>
                                        {isKnockoutTournament ? (
                                            <>
                                                <td className="points">{player.totalPoints || 0}</td>
                                                <td>{player.tournamentCount || 0}</td>
                                                <td className="wins">{player.winCount || 0}</td>
                                                <td className="runner-up">{player.runnerUpCount || 0}</td>
                                                <td className="semi">{player.semifinalCount || 0}</td>
                                                <td className="quarter">{player.quarterfinalCount || 0}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{player.matchesPlayed}</td>
                                                <td className="wins">{player.wins}</td>
                                                <td className="draws">{player.draws}</td>
                                                <td className="losses">{player.losses}</td>
                                                <td className="score">{player.score}</td>
                                                <td className="rating">{player.currentRating}</td>
                                                <td className={`rating-change ${player.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                                                    {player.ratingChange >= 0 ? '+' : ''}{player.ratingChange}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'crosstable' && crossTable && (
                <div className="crosstable-container">
                    <div className="crosstable-scroll">
                        <table className="crosstable">
                            <thead>
                                <tr>
                                    <th className="player-header">Player</th>
                                    {crossTable.players?.map((player, idx) => (
                                        <th key={player.playerId} className="opponent-header">
                                            <span className="opponent-num">{idx + 1}</span>
                                        </th>
                                    ))}
                                    <th className="score-header">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crossTable.crossTable?.map((row, rowIdx) => (
                                    <tr key={row.playerId}>
                                        <td className="player-cell">
                                            <span className="player-num">{rowIdx + 1}.</span>
                                            <span className="player-name">{row.playerName}</span>
                                        </td>
                                        {crossTable.players?.map((opponent) => {
                                            const result = row.results?.[opponent.playerId];
                                            const display = getResultDisplay(result);
                                            return (
                                                <td 
                                                    key={opponent.playerId} 
                                                    className={`result-cell ${display.class}`}
                                                    title={result?.ratingChange !== undefined ? 
                                                        `Rating change: ${result.ratingChange >= 0 ? '+' : ''}${result.ratingChange}` : 
                                                        ''}
                                                >
                                                    {display.text}
                                                    {result?.ratingChange !== undefined && (
                                                        <span className={`mini-change ${result.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                                                            {result.ratingChange >= 0 ? '+' : ''}{result.ratingChange}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="score-cell">{row.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="legend">
                        <h4>Legend</h4>
                        <div className="legend-items">
                            <span className="legend-item"><span className="result-sample win">1</span> Win</span>
                            <span className="legend-item"><span className="result-sample draw">½</span> Draw</span>
                            <span className="legend-item"><span className="result-sample loss">0</span> Loss</span>
                            <span className="legend-item"><span className="result-sample self">X</span> Self</span>
                            <span className="legend-item"><span className="result-sample not-played">-</span> Not played</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentStandingsPage;
