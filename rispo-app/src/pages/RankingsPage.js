import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import playerService from '../services/playerService';
import authService from '../services/authService';
import AdPanel from '../components/AdPanel';
import '../styles/RankingsPage.css';

const RankingsPage = () => {
    const navigate = useNavigate();
    const [topRankings, setTopRankings] = useState([]);
    const [currentUserRanking, setCurrentUserRanking] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    
    const [currentUser] = useState(() => authService.getCurrentUser());

    const loadRankings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // Load top 10 rankings
            const rankings = await playerService.getTop10Rankings();
            setTopRankings(rankings);
            
            // Load current user's ranking if not in top 10
            if (currentUser?.playerId) {
                try {
                    const userRanking = await playerService.getPlayerRanking(currentUser.playerId);
                    
                    // Only show current user separately if not in top 10
                    const isInTop10 = rankings.some(r => r.id === currentUser.playerId);
                    if (!isInTop10) {
                        setCurrentUserRanking(userRanking);
                    }
                } catch (err) {
                    console.log('Could not load user ranking:', err);
                    // User might not be verified, that's okay
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load rankings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?.userId) {
            setError('Please log in to view rankings');
            setLoading(false);
            return;
        }
        loadRankings();
    }, [currentUser?.userId, loadRankings]);

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        
        try {
            setSearching(true);
            const results = await playerService.searchPlayerRankings(searchTerm);
            setSearchResults(results);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getRankClassName = (rank) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return '';
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const renderRankingRow = (ranking, isCurrentUser = false) => {
        const rowClass = `ranking-row ${getRankClassName(ranking.rank)} ${isCurrentUser ? 'current-user' : ''}`;
        
        return (
            <tr key={ranking.id} className={rowClass}>
                <td className="rank-cell">{getRankIcon(ranking.rank)}</td>
                <td className="name-cell">
                    {ranking.name}
                    {isCurrentUser && <span className="you-badge">You</span>}
                </td>
                <td className="rating-cell">{ranking.rating}</td>
                <td className="stats-cell">{ranking.matchesPlayed}</td>
                <td className="stats-cell">{ranking.wins}</td>
                <td className="stats-cell">{ranking.losses}</td>
                <td className="stats-cell">{ranking.draws}</td>
                <td className="club-cell">{ranking.clubName || 'N/A'}</td>
            </tr>
        );
    };

    if (loading) {
        return <div className="rankings-page"><p>Loading rankings...</p></div>;
    }

    return (
        <div className="rankings-page">
            <div className="nav-header">
                <div className="nav-left">
                    <h2>Player Rankings</h2>
                </div>
                <div className="nav-right">
                    <button onClick={() => navigate(-1)} className="nav-btn">← Back</button>
                    <button onClick={() => navigate('/profile')} className="nav-btn">Profile</button>
                    <button onClick={handleLogout} className="nav-btn logout-btn">Sign Out</button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Search Section */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search for a player..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn" disabled={searching}>
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                    {searchTerm && (
                        <button type="button" onClick={clearSearch} className="clear-btn">
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="rankings-container search-results">
                    <h3>Search Results</h3>
                    <div className="table-wrapper">
                        <table className="rankings-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player Name</th>
                                    <th>Rating</th>
                                    <th>Matches</th>
                                    <th>Wins</th>
                                    <th>Losses</th>
                                    <th>Draws</th>
                                    <th>Club</th>
                                </tr>
                            </thead>
                            <tbody>
                                {searchResults.map(ranking => renderRankingRow(ranking, ranking.id === currentUser?.playerId))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top 10 Rankings */}
            <div className="rankings-container">
                <h3>🏆 Top 10 Players</h3>
                <div className="table-wrapper">
                    <table className="rankings-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player Name</th>
                                <th>Rating</th>
                                <th>Matches</th>
                                <th>Wins</th>
                                <th>Losses</th>
                                <th>Draws</th>
                                <th>Club</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topRankings.map(ranking => renderRankingRow(ranking, ranking.id === currentUser?.playerId))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Current User Ranking (if not in top 10) */}
            {currentUserRanking && (
                <div className="rankings-container current-user-section">
                    <h3>Your Ranking</h3>
                    <div className="table-wrapper">
                        <table className="rankings-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player Name</th>
                                    <th>Rating</th>
                                    <th>Matches</th>
                                    <th>Wins</th>
                                    <th>Losses</th>
                                    <th>Draws</th>
                                    <th>Club</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderRankingRow(currentUserRanking, true)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="rankings-legend">
                <h4>Legend</h4>
                <div className="legend-items">
                    <span className="legend-item">
                        <span className="legend-badge gold">🥇</span> 1st Place
                    </span>
                    <span className="legend-item">
                        <span className="legend-badge silver">🥈</span> 2nd Place
                    </span>
                    <span className="legend-item">
                        <span className="legend-badge bronze">🥉</span> 3rd Place
                    </span>
                    <span className="legend-item">
                        <span className="legend-badge current-user-badge">You</span> Your Ranking
                    </span>
                </div>
            </div>

            {/* Advertisement Sidebar */}
            <div className="ad-sidebar-section">
                <AdPanel placement="sidebar" size="medium" />
            </div>
        </div>
    );
};

export default RankingsPage;
