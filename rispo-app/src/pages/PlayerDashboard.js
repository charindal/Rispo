import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/authService';
import clubService from '../services/clubService';
import challengeService from '../services/challengeService';
import '../styles/PlayerDashboard.css';

const PlayerDashboard = () => {
  const [user, setUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [pendingAcknowledgments, setPendingAcknowledgments] = useState([]);
  const [showJoinClubModal, setShowJoinClubModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user is a player
    if (currentUser.role !== 'PLAYER') {
      navigate('/admin-dashboard');
      return;
    }

    setUser(currentUser);
    fetchPlayerData(currentUser.playerId);
    loadClubs();
    loadChallenges(currentUser);
  }, [navigate]);

  const loadChallenges = async (currentUser) => {
    try {
      const [incoming, acknowledgments] = await Promise.all([
        challengeService.getIncomingChallenges(currentUser.userId),
        challengeService.getPendingAcknowledgments(currentUser.userId)
      ]);
      setIncomingChallenges(incoming.filter(c => c.status === 'PENDING'));
      setPendingAcknowledgments(acknowledgments);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadClubs = async () => {
    try {
      const clubsData = await clubService.getActiveClubs();
      setClubs(clubsData);
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  };

  const fetchPlayerData = async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players`);
      const player = response.data.find(p => p.id === playerId);
      setPlayerData(player);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  const handleRequestVerification = async () => {
    setRequestingVerification(true);
    // In a real app, this would send a verification request to admins
    setTimeout(() => {
      alert('Verification request submitted! An admin will review your account.');
      setRequestingVerification(false);
    }, 1000);
  };

  const handleJoinClub = async (e) => {
    e.preventDefault();
    if (!selectedClubId) {
      alert('Please select a club');
      return;
    }
    try {
      await clubService.requestToJoinClub(selectedClubId, joinMessage, user.playerId);
      alert('Join request submitted successfully! The club admin will review your request.');
      setShowJoinClubModal(false);
      setSelectedClubId('');
      setJoinMessage('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="player-dashboard">
      <nav className="player-navbar">
        <div className="navbar-brand">
          <h2>Rispo</h2>
          <span className="player-badge">Player</span>
        </div>
        <div className="navbar-user">
          <button onClick={() => navigate('/profile')} className="profile-btn">My Profile</button>
          <span className="username">{user?.username}</span>
          <button onClick={handleSignOut} className="signout-btn">Sign Out</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {playerData?.name || user?.username}!</h1>
          <p>Your personal rating dashboard</p>
        </div>

        {!playerData?.isVerified && (
          <div className="verification-alert">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h3>Account Not Verified</h3>
              <p>Your account needs to be verified by an admin to participate in rated matches.</p>
              <button 
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="request-verification-btn"
              >
                {requestingVerification ? 'Requesting...' : 'Request Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Challenge Notifications */}
        {(incomingChallenges.length > 0 || pendingAcknowledgments.length > 0) && (
          <div className="challenges-alert">
            <div className="alert-icon">🎯</div>
            <div className="alert-content">
              <h3>Action Required!</h3>
              {incomingChallenges.length > 0 && (
                <p>
                  <strong>{incomingChallenges.length}</strong> new challenge{incomingChallenges.length > 1 ? 's' : ''} waiting for your response
                </p>
              )}
              {pendingAcknowledgments.length > 0 && (
                <p>
                  <strong>{pendingAcknowledgments.length}</strong> match result{pendingAcknowledgments.length > 1 ? 's' : ''} need acknowledgment
                </p>
              )}
              <button 
                onClick={() => navigate('/challenges')}
                className="view-challenges-btn"
              >
                View Challenges →
              </button>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card rating-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Current Rating</h3>
              <p className="stat-value">{playerData?.rating || 1200}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-content">
              <h3>Matches Played</h3>
              <p className="stat-value">{playerData?.matchesPlayed || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>Win Rate</h3>
              <p className="stat-value">
                {playerData?.matchesPlayed > 0 
                  ? `${Math.round((playerData.wins / playerData.matchesPlayed) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Games Played</h3>
              <p className="stat-value">{playerData?.gamesPlayed || 0}</p>
            </div>
          </div>
        </div>

        <div className="record-section">
          <h2>Match Record</h2>
          <div className="record-bars">
            <div className="record-item wins">
              <span className="record-label">Wins</span>
              <div className="record-bar-container">
                <div 
                  className="record-bar" 
                  style={{width: `${playerData?.matchesPlayed > 0 ? (playerData.wins / playerData.matchesPlayed) * 100 : 0}%`}}
                ></div>
              </div>
              <span className="record-value">{playerData?.wins || 0}</span>
            </div>

            <div className="record-item losses">
              <span className="record-label">Losses</span>
              <div className="record-bar-container">
                <div 
                  className="record-bar" 
                  style={{width: `${playerData?.matchesPlayed > 0 ? (playerData.losses / playerData.matchesPlayed) * 100 : 0}%`}}
                ></div>
              </div>
              <span className="record-value">{playerData?.losses || 0}</span>
            </div>

            <div className="record-item draws">
              <span className="record-label">Draws</span>
              <div className="record-bar-container">
                <div 
                  className="record-bar" 
                  style={{width: `${playerData?.matchesPlayed > 0 ? (playerData.draws / playerData.matchesPlayed) * 100 : 0}%`}}
                ></div>
              </div>
              <span className="record-value">{playerData?.draws || 0}</span>
            </div>
          </div>
        </div>

        <div className="contact-info">
          <h2>Actions</h2>
          <div className="actions-section">
            <button onClick={() => navigate('/challenges')} className="action-button primary">
              ⚔️ Challenge Players
            </button>
            <button onClick={() => navigate('/submit-match')} className="action-button primary">
              📝 Submit Match Result
            </button>
            <button onClick={() => navigate('/profile')} className="action-button">
              👤 Edit Profile
            </button>
          </div>
        </div>

        <div className="contact-info">
          <h2>Contact Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{playerData?.email || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{playerData?.phone || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`status-badge ${playerData?.isVerified ? 'verified' : 'unverified'}`}>
                {playerData?.isVerified ? '✓ Verified' : '⚠ Unverified'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Club:</span>
              <span className="info-value">
                {playerData?.clubName || (
                  <button onClick={() => setShowJoinClubModal(true)} className="join-club-btn">
                    Join a Club
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Join Club Modal */}
      {showJoinClubModal && (
        <div className="modal-overlay" onClick={() => setShowJoinClubModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Request to Join a Club</h2>
            <form onSubmit={handleJoinClub}>
              <div className="form-group">
                <label>Select Club *</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  required
                >
                  <option value="">Choose a club...</option>
                  {clubs.map(club => (
                    <option key={club.clubId} value={club.clubId}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Message (Optional)</label>
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Introduce yourself or explain why you want to join this club"
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowJoinClubModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
