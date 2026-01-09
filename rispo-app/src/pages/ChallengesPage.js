import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import challengeService from '../services/challengeService';
import playerService from '../services/playerService';
import axios from 'axios';
import '../styles/ChallengesPage.css';

const ChallengesPage = () => {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [outgoingChallenges, setOutgoingChallenges] = useState([]);
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const [pendingOutgoingCount, setPendingOutgoingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('incoming'); // incoming, outgoing, create
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [challengeName, setChallengeName] = useState('');
  const [challengeMessage, setChallengeMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  const loadChallenges = useCallback(async (currentUser) => {
    try {
      const [incoming, outgoing] = await Promise.all([
        challengeService.getIncomingChallenges(currentUser.userId),
        challengeService.getOutgoingChallenges(currentUser.userId)
      ]);
      setIncomingChallenges(incoming);
      setOutgoingChallenges(outgoing);
      
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

    setLoading(true);
    setError('');

    try {
      await challengeService.createChallenge({
        challengedPlayerId: parseInt(selectedOpponent),
        challengeName: challengeName || null,
        message: challengeMessage
      }, user.userId);

      alert('Challenge sent successfully!');
      setSelectedOpponent('');
      setChallengeName('');
      setChallengeMessage('');
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
    if (user && user.clubId) {
      try {
        const results = await playerService.searchPlayersByClub(user.clubId, term);
        setPlayers(results.filter(p => p.id !== user.playerId));
      } catch (err) {
        console.error('Error searching players:', err);
      }
    }
  };

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

  return (
    <div className="challenges-page">
      <nav className="challenges-navbar">
        <h2>🎯 Challenges</h2>
        <button onClick={() => navigate('/player-dashboard')} className="back-btn">← Back</button>
      </nav>

      <div className="challenges-container">
        <div className="tabs">
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

        {/* Incoming Challenges Tab */}
        {activeTab === 'incoming' && (
          <div className="tab-content">
            <h2>Incoming Challenges</h2>
            {incomingChallenges.length === 0 ? (
              <p className="empty-state">No incoming challenges</p>
            ) : (
              <div className="challenges-list">
                {incomingChallenges.map(challenge => (
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
            )}
          </div>
        )}

        {/* Outgoing Challenges Tab */}
        {activeTab === 'outgoing' && (
          <div className="tab-content">
            <h2>Outgoing Challenges</h2>
            {outgoingChallenges.length === 0 ? (
              <p className="empty-state">No outgoing challenges</p>
            ) : (
              <div className="challenges-list">
                {outgoingChallenges.map(challenge => (
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
                  <label>Search Opponent *</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => handleSearchPlayers(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="form-group">
                  <label>Select Opponent *</label>
                  <select 
                    value={selectedOpponent} 
                    onChange={(e) => setSelectedOpponent(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Choose opponent...</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Rating: {p.rating})
                      </option>
                    ))}
                  </select>
                  {user?.clubId && (
                    <small className="form-hint">Showing verified players from your club</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Challenge Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Friday Night Match"
                    value={challengeName}
                    onChange={(e) => setChallengeName(e.target.value)}
                    maxLength="100"
                    disabled={loading}
                  />
                  <small className="form-hint">Give your challenge a friendly name</small>
                </div>

                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea
                    value={challengeMessage}
                    onChange={(e) => setChallengeMessage(e.target.value)}
                    placeholder="Add a message to your challenge..."
                    rows="4"
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
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
