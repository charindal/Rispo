import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/authService';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/MatchHistoryPage.css';

const MatchHistoryPage = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  const [user, setUser] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [displayMatches, setDisplayMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 20;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    loadAllMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadAllMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/matches`);
      const sorted = (response.data || []).sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || a.matchDate);
        const dateB = new Date(b.submittedAt || b.createdAt || b.matchDate);
        return dateB - dateA;
      });
      setAllMatches(sorted);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = allMatches;
    if (filterStatus !== 'all') {
      filtered = allMatches.filter(m => (m.status || '').toUpperCase() === filterStatus.toUpperCase());
    }
    if (sortBy === 'oldest') {
      filtered = [...filtered].reverse();
    }
    const startIdx = (currentPage - 1) * matchesPerPage;
    setDisplayMatches(filtered.slice(startIdx, startIdx + matchesPerPage));
  }, [filterStatus, sortBy, currentPage, allMatches]);

  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Date Error';
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'APPROVED') return <span className="badge approved">✓ APPROVED</span>;
    if (s === 'REJECTED') return <span className="badge rejected">✗ REJECTED</span>;
    return <span className="badge pending">⏳ PENDING</span>;
  };

  const getScoreDisplay = (match) => {
    if (!match.games || match.games.length === 0) return 'N/A';
    const p1 = match.games.reduce((sum, g) => sum + (g.player1Score || 0), 0);
    const p2 = match.games.reduce((sum, g) => sum + (g.player2Score || 0), 0);
    return `${p1} - ${p2}`;
  };

  const filteredCount = filterStatus === 'all'
    ? allMatches.length
    : allMatches.filter(m => (m.status || '').toUpperCase() === filterStatus.toUpperCase()).length;

  const totalPages = Math.ceil(filteredCount / matchesPerPage);

  if (loading) {
    return <div className="loading-screen">Loading matches...</div>;
  }

  return (
    <div className="match-history-container">
      <nav className="match-navbar">
        <div className="navbar-brand">
          <h2>Match Database</h2>
        </div>
        <div className="navbar-user">
          <span className="username">{user?.username}</span>
          <HamburgerMenu user={user} onSignOut={handleSignOut} />
        </div>
      </nav>

      <div className="match-history-content">
        <div className="history-header">
          <h1>All Matches</h1>
          <p>{allMatches.length} matches in the database</p>
        </div>

        <div className="controls-section">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="sort-group">
            <label>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="sort-select"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="matches-list">
          {displayMatches.length === 0 ? (
            <div className="no-matches">
              <div className="no-matches-icon">📭</div>
              <h3>No matches found</h3>
            </div>
          ) : (
            <>
              {displayMatches.map((match) => (
                <div key={match.matchId || match.id} className="match-card">
                  <div className="match-result-badge">
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="match-details">
                    <div className="opponent-info">
                      <h3 className="opponent-name">
                        {match.player1?.name || match.player1Name || 'Player 1'}
                        {' vs '}
                        {match.player2?.name || match.player2Name || 'Player 2'}
                      </h3>
                      <p className="match-date">{formatDate(match.submittedAt || match.createdAt || match.matchDate)}</p>
                    </div>
                    <div className="match-score">
                      <div className="score-display">
                        <span className="player-score">{getScoreDisplay(match)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
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