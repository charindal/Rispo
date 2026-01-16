import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/authService';
import matchService from '../services/matchService';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/MatchHistoryPage.css';

const MatchHistoryPage = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  const [user, setUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [displayMatches, setDisplayMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, won, lost
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.playerId) {
      navigate('/player-dashboard');
      return;
    }

    setUser(currentUser);
    loadPlayerDataAndMatches(currentUser.playerId);
  }, [navigate]);

  const loadPlayerDataAndMatches = async (playerId) => {
    try {
      setLoading(true);
      // Fetch player data
      const playerResponse = await axios.get(`${API_BASE_URL}/players`);
      const player = playerResponse.data.find(p => p.id === playerId);
      setPlayerData(player);

      // Fetch all matches
      const playerMatches = await matchService.getPlayerMatches(playerId);
      
      console.log('Loaded matches:', playerMatches); // Debug log
      
      // Sort matches by date (most recent first)
      const sortedMatches = playerMatches.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || a.matchDate);
        const dateB = new Date(b.submittedAt || b.createdAt || b.matchDate);
        return dateB - dateA;
      });
      
      setAllMatches(sortedMatches);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateDisplayMatches(allMatches, filterStatus, sortBy, currentPage);
  }, [filterStatus, sortBy, currentPage, allMatches, user]);

  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  const getMatchResult = (match) => {
    // Determine if player won or lost based on game results
    if (!match.games || match.games.length === 0) return null;

    let playerWins = 0;
    let opponentWins = 0;

    match.games.forEach(game => {
      if (user?.playerId === match.player1Id) {
        if (game.player1Score > game.player2Score) {
          playerWins++;
        } else if (game.player2Score > game.player1Score) {
          opponentWins++;
        }
      } else {
        if (game.player2Score > game.player1Score) {
          playerWins++;
        } else if (game.player1Score > game.player2Score) {
          opponentWins++;
        }
      }
    });

    if (playerWins > opponentWins) return 'won';
    if (playerWins < opponentWins) return 'lost';
    return 'draw';
  };

  const updateDisplayMatches = (matches, status, order, page) => {
    // Filter matches
    let filtered = matches;
    if (status === 'won') {
      filtered = matches.filter(m => getMatchResult(m) === 'won');
    } else if (status === 'lost') {
      filtered = matches.filter(m => getMatchResult(m) === 'lost');
    }

    // Sort matches
    if (order === 'oldest') {
      filtered = [...filtered].reverse();
    }

    // Paginate
    const startIdx = (page - 1) * matchesPerPage;
    const paginatedMatches = filtered.slice(startIdx, startIdx + matchesPerPage);
    
    setDisplayMatches(paginatedMatches);
  };

  const getOpponentName = (match) => {
    if (match.player1Id === user?.playerId) {
      return match.player2?.name || match.player2Name || 'Unknown';
    }
    return match.player1?.name || match.player1Name || 'Unknown';
  };

  const getPlayerScore = (match) => {
    if (!match.games || match.games.length === 0) return 0;
    
    let totalScore = 0;
    match.games.forEach(game => {
      if (match.player1Id === user?.playerId) {
        totalScore += game.player1Score || 0;
      } else {
        totalScore += game.player2Score || 0;
      }
    });
    return totalScore;
  };

  const getOpponentScore = (match) => {
    if (!match.games || match.games.length === 0) return 0;
    
    let totalScore = 0;
    match.games.forEach(game => {
      if (match.player1Id === user?.playerId) {
        totalScore += game.player2Score || 0;
      } else {
        totalScore += game.player1Score || 0;
      }
    });
    return totalScore;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Date Error';
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading match history...</div>;
  }

  return (
    <div className="match-history-container">
      {/* Navbar */}
      <nav className="match-navbar">
        <div className="navbar-brand">
          <img src="/logo.jpeg" alt="Rispo Logo" className="navbar-logo" />
          <h2>Match History</h2>
        </div>
        <div className="navbar-user">
          <span className="username">{user?.username}</span>
          <HamburgerMenu user={user} onSignOut={handleSignOut} />
        </div>
      </nav>

      {/* Main Content */}
      <div className="match-history-content">
        {/* Header Section */}
        <div className="history-header">
          <h1>Your Match History</h1>
          <p>View all your matches and results</p>
        </div>

        {/* Stats Section */}
        {playerData && (
          <div className="match-stats">
            <div className="stat-card wins">
              <div className="stat-label">Wins</div>
              <div className="stat-value">{playerData?.wins || 0}</div>
            </div>
            <div className="stat-card losses">
              <div className="stat-label">Losses</div>
              <div className="stat-value">{playerData?.losses || 0}</div>
            </div>
            <div className="stat-card draws">
              <div className="stat-label">Draws</div>
              <div className="stat-value">{playerData?.draws || 0}</div>
            </div>
            <div className="stat-card total">
              <div className="stat-label">Total Matches</div>
              <div className="stat-value">{playerData?.matchesPlayed || 0}</div>
            </div>
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="controls-section">
          <div className="filter-group">
            <label>Filter:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Matches</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="sort-group">
            <label>Sort:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Matches List */}
        <div className="matches-list">
          {displayMatches.length === 0 ? (
            <div className="no-matches">
              <div className="no-matches-icon">📭</div>
              <h3>No matches found</h3>
              <p>
                {filterStatus === 'all' 
                  ? 'You haven\'t played any matches yet.' 
                  : `You don't have any ${filterStatus} matches yet.`}
              </p>
              <button 
                onClick={() => navigate('/player-dashboard')}
                className="back-button"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              {displayMatches.map((match) => {
                const result = getMatchResult(match);
                const playerScore = getPlayerScore(match);
                const opponentScore = getOpponentScore(match);
                const opponentName = getOpponentName(match);

                return (
                  <div key={match.matchId} className={`match-card result-${result || 'pending'}`}>
                    <div className="match-result-badge">
                      {result === 'won' && <span className="badge won">✓ WIN</span>}
                      {result === 'lost' && <span className="badge lost">✗ LOSS</span>}
                      {result === null && <span className="badge pending">⏳ PENDING</span>}
                    </div>

                    <div className="match-details">
                      <div className="opponent-info">
                        <h3 className="opponent-name">vs {opponentName}</h3>
                        <p className="match-date">{formatDate(match.submittedAt || match.createdAt || match.matchDate)}</p>
                      </div>

                      <div className="match-score">
                        <div className="score-display">
                          <span className={`player-score ${result === 'won' ? 'winning' : result === 'lost' ? 'losing' : ''}`}>
                            {playerScore}
                          </span>
                          <span className="score-separator">-</span>
                          <span className={`opponent-score ${result === 'lost' ? 'winning' : result === 'won' ? 'losing' : ''}`}>
                            {opponentScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {result === null && (
                      <div className="pending-note">Awaiting review</div>
                    )}
                  </div>
                );
              })}
              
              {/* Pagination Controls */}
              {allMatches.length > matchesPerPage && (
                <div className="pagination-controls">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {Math.ceil(
                      (filterStatus === 'won' ? allMatches.filter(m => getMatchResult(m) === 'won').length :
                       filterStatus === 'lost' ? allMatches.filter(m => getMatchResult(m) === 'lost').length :
                       allMatches.length) / matchesPerPage
                    )}
                  </span>
                  <button 
                    onClick={() => {
                      const totalPages = Math.ceil(
                        (filterStatus === 'won' ? allMatches.filter(m => getMatchResult(m) === 'won').length :
                         filterStatus === 'lost' ? allMatches.filter(m => getMatchResult(m) === 'lost').length :
                         allMatches.length) / matchesPerPage
                      );
                      setCurrentPage(p => Math.min(p + 1, totalPages));
                    }}
                    disabled={currentPage >= Math.ceil(
                      (filterStatus === 'won' ? allMatches.filter(m => getMatchResult(m) === 'won').length :
                       filterStatus === 'lost' ? allMatches.filter(m => getMatchResult(m) === 'lost').length :
                       allMatches.length) / matchesPerPage
                    )}
                    className="pagination-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchHistoryPage;
