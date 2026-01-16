import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import challengeService from '../services/challengeService';
import playerService from '../services/playerService';
import Pagination from '../components/Pagination';
import axios from 'axios';
import '../styles/ChallengesPage.css';

const ChallengesPage = () => {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [outgoingChallenges, setOutgoingChallenges] = useState([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState([]);
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const [pendingOutgoingCount, setPendingOutgoingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, incoming, outgoing, create
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [selectedOpponentName, setSelectedOpponentName] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResultsPage, setSearchResultsPage] = useState(1);
  const [format, setFormat] = useState('');
  const [dateOfMatch, setDateOfMatch] = useState('');
  const [timeOfMatch, setTimeOfMatch] = useState('');
  const [pot, setPot] = useState('');
  const [venue, setVenue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [incomingPage, setIncomingPage] = useState(1);
  const [outgoingPage, setOutgoingPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  const loadChallenges = useCallback(async (currentUser) => {
    try {
      const [incoming, outgoing, upcoming] = await Promise.all([
        challengeService.getIncomingChallenges(currentUser.userId),
        challengeService.getOutgoingChallenges(currentUser.userId),
        challengeService.getUpcomingChallenges()
      ]);
      setIncomingChallenges(incoming);
      setOutgoingChallenges(outgoing);
      setUpcomingChallenges(upcoming);
      
      // Calculate pending counts (only PENDING status)
      setPendingIncomingCount(incoming.filter(c => c.status === 'PENDING').length);
      setPendingOutgoingCount(outgoing.filter(c => c.status === 'PENDING').length);
    } catch (err) {
      console.error('Error loading challenges:', err);
    }
  }, []);

  const loadData = useCallback(async (currentUser) => {
    setLoading(true);
    try {
      // Load players from current user's club for fast search
      if (currentUser.clubId) {
        const clubPlayers = await playerService.searchPlayersByClub(currentUser.clubId, '');
        setPlayers(clubPlayers.filter(p => p.id !== currentUser.playerId));
      } else {
        // Fallback to all players if no club
        const playersResponse = await axios.get(`${API_BASE_URL}/players`);
        setPlayers(playersResponse.data.filter(p => p.id !== currentUser.playerId));
      }

      // Load challenges
      await loadChallenges(currentUser);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, loadChallenges]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.playerId) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    loadData(currentUser);
  }, [navigate, loadData]);

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!selectedOpponent) {
      setError('Please select an opponent');
      return;
    }
    if (!format || !dateOfMatch || !timeOfMatch || !pot || !venue) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await challengeService.createChallenge({
        challengedPlayerId: parseInt(selectedOpponent),
        challengeName: null,
        message: '',
        format: format,
        dateOfMatch: new Date(dateOfMatch).toISOString(),
        timeOfMatch: timeOfMatch,
        pot: parseFloat(pot),
        venue: venue
      }, user.userId);

      alert('Challenge sent successfully!');
      setSelectedOpponent('');
      setSelectedOpponentName('');
      setFormat('');
      setDateOfMatch('');
      setTimeOfMatch('');
      setPot('');
      setVenue('');
      setSearchTerm('');
      setPlayers([]);
      await loadChallenges(user);
      setActiveTab('outgoing');
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPlayers = async (term) => {
    setSearchTerm(term);
    if (term.trim().length < 2) {
      setPlayers([]);
      setShowSearchResults(false);
      return;
    }
    setLoading(true);
    try {
      console.log('Searching for players with term:', term, 'clubId:', user?.clubId);
      const results = await playerService.searchPlayersByClub(user.clubId, term);
      console.log('Search results:', results);
      setPlayers(results.filter(p => p.id !== user.playerId));
      setShowSearchResults(true);
      setSearchResultsPage(1);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search players. Please try again.');
      setPlayers([]);
      setShowSearchResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOpponent = (player) => {
    setSelectedOpponent(player.id);
    setSelectedOpponentName(player.name);
    setShowSearchResults(false);
    setSearchTerm('');
  };

  const paginatedSearchResults = players.slice(
    (searchResultsPage - 1) * 5,
    searchResultsPage * 5
  );

  const handleRespondToChallenge = async (challengeId, response) => {
    try {
      await challengeService.respondToChallenge(challengeId, response, user.userId);
      alert(`Challenge ${response.toLowerCase()} successfully!`);
      await loadChallenges(user);
    } catch (err) {
      alert('Error: ' + err.toString());
    }
  };

  const handleCancelChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to cancel this challenge?')) {
      return;
    }

    try {
      await challengeService.cancelChallenge(challengeId, user.userId);
      alert('Challenge cancelled successfully');
      await loadChallenges(user);
    } catch (err) {
      alert('Error: ' + err.toString());
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'status-accepted';
      case 'DECLINED': return 'status-declined';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Pagination logic
  const getPaginatedItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const paginatedIncoming = getPaginatedItems(incomingChallenges, incomingPage);
  const paginatedOutgoing = getPaginatedItems(outgoingChallenges, outgoingPage);

  return (
    <div className="challenges-page">
      <nav className="challenges-navbar">
        <h2>🎯 Challenges</h2>
        <button onClick={() => navigate('/player-dashboard')} className="back-btn">🏠 Home</button>
      </nav>

      <div className="challenges-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            🔥 Upcoming Matches
          </button>
          <button 
            className={`tab ${activeTab === 'incoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('incoming')}
          >
            📥 Incoming ({pendingIncomingCount})
          </button>
          <button 
            className={`tab ${activeTab === 'outgoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('outgoing')}
          >
            📤 Outgoing ({pendingOutgoingCount})
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ New Challenge
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Upcoming Challenges Tab */}
        {activeTab === 'upcoming' && (
          <div className="tab-content">
            <h2>🔥 Upcoming Matches ({upcomingChallenges.length})</h2>
            {upcomingChallenges.length === 0 ? (
              <p className="no-challenges">No upcoming matches scheduled</p>
            ) : (
              <div className="challenges-list">
                {upcomingChallenges.map(challenge => (
                  <div key={challenge.challengeId} className="challenge-card upcoming">
                    <div className="challenge-header">
                      <h3>{challenge.challengerName} vs {challenge.challengedName}</h3>
                      <div className="challenge-ratings">
                        <span className="rating">⭐ {challenge.challengerRating}</span>
                        <span className="vs">VS</span>
                        <span className="rating">⭐ {challenge.challengedRating}</span>
                      </div>
                    </div>
                    <div className="challenge-details">
                      {challenge.format && (
                        <div className="detail-row">
                          <strong>Format:</strong> {challenge.format}
                        </div>
                      )}
                      {challenge.dateOfMatch && (
                        <div className="detail-row">
                          <strong>Date:</strong> {new Date(challenge.dateOfMatch).toLocaleDateString()}
                        </div>
                      )}
                      {challenge.timeOfMatch && (
                        <div className="detail-row">
                          <strong>Time:</strong> {challenge.timeOfMatch}
                        </div>
                      )}
                      {challenge.pot && (
                        <div className="detail-row pot">
                          <strong>💰 Pot:</strong> R {challenge.pot.toFixed(2)}
                        </div>
                      )}
                      {challenge.venue && (
                        <div className="detail-row">
                          <strong>📍 Venue:</strong> {challenge.venue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Incoming Challenges Tab */}
        {activeTab === 'incoming' && (
          <div className="tab-content">
            <h2>Incoming Challenges ({incomingChallenges.length})</h2>
            {incomingChallenges.length === 0 ? (
              <p className="empty-state">No incoming challenges</p>
            ) : (
              <>
                <div className="challenges-list">
                  {paginatedIncoming.map(challenge => (
                    <div key={challenge.challengeId} className="challenge-card">
                      <div className="challenge-header">
                        <h3>{challenge.challengerName}</h3>
                        <span className={`status-badge ${getStatusColor(challenge.status)}`}>
                          {challenge.status}
                        </span>
                      </div>
                      {challenge.challengeName && (
                        <p className="challenge-name">📌 {challenge.challengeName}</p>
                      )}
                      {challenge.message && (
                        <p className="challenge-message">"{challenge.message}"</p>
                      )}
                      <p className="challenge-date">
                        Received: {new Date(challenge.createdAt).toLocaleString()}
                      </p>
                      {challenge.status === 'ACCEPTED' && challenge.matchId && (
                        <button 
                          className="match-link-btn"
                          onClick={() => navigate(`/submit-match?matchId=${challenge.matchId}`)}
                        >
                          📝 Submit Match Result
                        </button>
                      )}
                      {challenge.status === 'PENDING' && (
                        <div className="challenge-actions">
                          <button 
                            className="accept-btn"
                            onClick={() => handleRespondToChallenge(challenge.challengeId, 'ACCEPTED')}
                          >
                            ✓ Accept
                          </button>
                          <button 
                            className="decline-btn"
                            onClick={() => handleRespondToChallenge(challenge.challengeId, 'DECLINED')}
                          >
                            ✗ Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Pagination
                  currentPage={incomingPage}
                  totalItems={incomingChallenges.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setIncomingPage}
                />
              </>
            )}
          </div>
        )}

        {/* Outgoing Challenges Tab */}
        {activeTab === 'outgoing' && (
          <div className="tab-content">
            <h2>Outgoing Challenges ({outgoingChallenges.length})</h2>
            {outgoingChallenges.length === 0 ? (
              <p className="empty-state">No outgoing challenges</p>
            ) : (
              <>
                <div className="challenges-list">
                  {paginatedOutgoing.map(challenge => (
                    <div key={challenge.challengeId} className="challenge-card">
                      <div className="challenge-header">
                        <h3>To: {challenge.challengedName}</h3>
                        <span className={`status-badge ${getStatusColor(challenge.status)}`}>
                          {challenge.status}
                        </span>
                      </div>
                      {challenge.challengeName && (
                        <p className="challenge-name">📌 {challenge.challengeName}</p>
                      )}
                      {challenge.message && (
                        <p className="challenge-message">"{challenge.message}"</p>
                      )}
                      <p className="challenge-date">
                        Sent: {new Date(challenge.createdAt).toLocaleString()}
                      </p>
                      {challenge.status === 'ACCEPTED' && challenge.matchId && (
                        <button 
                          className="match-link-btn"
                          onClick={() => navigate(`/submit-match?matchId=${challenge.matchId}`)}
                        >
                          📝 Submit Match Result
                        </button>
                      )}
                      {challenge.status === 'PENDING' && (
                        <div className="challenge-actions">
                          <button 
                            className="cancel-btn"
                            onClick={() => handleCancelChallenge(challenge.challengeId)}
                          >
                            Cancel Challenge
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Pagination
                  currentPage={outgoingPage}
                  totalItems={outgoingChallenges.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setOutgoingPage}
                />
              </>
            )}
          </div>
        )}

        {/* Create Challenge Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <div className="create-challenge-form">
              <h2>Create New Challenge</h2>
              <form onSubmit={handleCreateChallenge}>
                <div className="form-group">
                  <label>Search & Select Opponent *</label>
                  <div className="search-container">
                    <div className="search-input-group">
                      <input
                        type="text"
                        placeholder="Type player name (min 2 characters)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchPlayers(searchTerm);
                          }
                        }}
                        className="search-input"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => handleSearchPlayers(searchTerm)}
                        className="search-btn"
                        disabled={loading || searchTerm.trim().length < 2}
                      >
                        🔍 Search
                      </button>
                    </div>
                    {selectedOpponent && (
                      <div className="selected-opponent">
                        <span>✓ Selected: <strong>{selectedOpponentName}</strong></span>
                        <button 
                          type="button" 
                          className="clear-selection-btn"
                          onClick={() => {
                            setSelectedOpponent('');
                            setSelectedOpponentName('');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {showSearchResults && players.length > 0 && (
                    <div className="search-results-box">
                      <div className="search-results-list">
                        {paginatedSearchResults.map(player => (
                          <div 
                            key={player.id} 
                            className="search-result-item"
                            onClick={() => handleSelectOpponent(player)}
                          >
                            <div className="player-info">
                              <span className="player-name">{player.name}</span>
                              <span className="player-rating">⭐ {player.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {players.length > 5 && (
                        <div className="search-pagination">
                          <button
                            type="button"
                            onClick={() => setSearchResultsPage(prev => Math.max(1, prev - 1))}
                            disabled={searchResultsPage === 1}
                            className="page-btn"
                          >
                            ‹ Prev
                          </button>
                          <span className="page-info">
                            {searchResultsPage} / {Math.ceil(players.length / 5)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSearchResultsPage(prev => Math.min(Math.ceil(players.length / 5), prev + 1))}
                            disabled={searchResultsPage >= Math.ceil(players.length / 5)}
                            className="page-btn"
                          >
                            Next ›
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {showSearchResults && players.length === 0 && (
                    <div className="no-results">No players found</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Format *</label>
                  <input
                    type="text"
                    placeholder="e.g., Race to 7, Race to 9, Best of 5"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    maxLength="100"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date of Match *</label>
                  <input
                    type="date"
                    value={dateOfMatch}
                    onChange={(e) => setDateOfMatch(e.target.value)}
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Time of Match *</label>
                  <input
                    type="time"
                    value={timeOfMatch}
                    onChange={(e) => setTimeOfMatch(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pot Amount (R) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={pot}
                    onChange={(e) => setPot(e.target.value)}
                    step="0.01"
                    min="0"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Venue *</label>
                  <input
                    type="text"
                    placeholder="e.g., Club House, Main Street, Johannesburg"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    maxLength="255"
                    disabled={loading}
                    required
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading || !selectedOpponent}>
                  {loading ? 'Sending...' : '⚔ Send Challenge'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;
