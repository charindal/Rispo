import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import playerService from '../services/playerService';
import authService from '../services/authService';
import HamburgerMenu from '../components/HamburgerMenu';
import Pagination from '../components/Pagination';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [searchPage, setSearchPage] = useState(1);
    const itemsPerPage = 20;
    
    const [currentUser] = useState(() => authService.getCurrentUser());

    const loadRankings = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // Load top 100 rankings for pagination
            const rankings = await playerService.getTop10Rankings();
            setTopRankings(rankings);
            
            // Load current user's ranking if not in top rankings
            if (currentUser?.playerId) {
                try {
                    const userRanking = await playerService.getPlayerRanking(currentUser.playerId);
                    
                    // Only show current user separately if not in displayed rankings
                    const isInRankings = rankings.some(r => r.id === currentUser.playerId);
                    if (!isInRankings) {
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
            navigate('/login');
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        loadRankings();
    }, [currentUser?.userId, loadRankings]);

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setSearchPage(1);
            return;
        }
        
        try {
            setSearching(true);
            const results = await playerService.searchPlayerRankings(searchTerm);
            setSearchResults(results);
            setSearchPage(1);
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
        setSearchPage(1);
    };

    const handleSignOut = () => {
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
            </tr>
        );
    };

    if (loading) {
        return <div className="rankings-page"><p>Loading rankings...</p></div>;
    }

    // Pagination logic
    const getPaginatedItems = (items, page) => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    };

    const paginatedTopRankings = getPaginatedItems(topRankings, currentPage);
    const paginatedSearchResults = getPaginatedItems(searchResults, searchPage);

    return (
        <div className="rankings-page">
            <nav className="match-navbar">
                <div className="navbar-brand">
                    <h2>Player Rankings</h2>
                </div>
                <div className="navbar-user">
                    <span className="username">{currentUser?.username}</span>
                    <HamburgerMenu user={currentUser} onSignOut={handleSignOut} />
                </div>
            </nav>

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
                    <h3>Search Results ({searchResults.length})</h3>
                    <div className="table-wrapper">
                        <table className="rankings-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player Name</th>
                                    <th>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSearchResults.map(ranking => renderRankingRow(ranking, ranking.id === currentUser?.playerId))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={searchPage}
                        totalItems={searchResults.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setSearchPage}
                    />
                </div>
            )}

            {/* Top Rankings */}
            <div className="rankings-container">
                <h3>🏆 Top Players</h3>
                <div className="table-wrapper">
                    <table className="rankings-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player Name</th>
                                <th>Rating</th>

                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTopRankings.map(ranking => renderRankingRow(ranking, ranking.id === currentUser?.playerId))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalItems={topRankings.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
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
        </div>
    );
};

export default RankingsPage;
