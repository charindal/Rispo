import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/authService';
import clubService from '../services/clubService';
import challengeService from '../services/challengeService';
import AdPanel from '../components/AdPanel';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/PlayerDashboard.css';

const PlayerDashboard = () => {
  const [user, setUser] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [showJoinClubModal, setShowJoinClubModal] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchSuburb, setSearchSuburb] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  const loadChallenges = useCallback(async (currentUser) => {
    try {
      const incoming = await challengeService.getIncomingChallenges(currentUser.userId);
      setIncomingChallenges(incoming.filter(c => c.status === 'PENDING'));
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  }, []);

  const loadClubs = useCallback(async () => {
    try {
      const clubsData = await clubService.getActiveClubs();
      setClubs(clubsData);
      setFilteredClubs(clubsData);
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  }, []);

  const fetchPlayerData = useCallback(async (playerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players`);
      const player = response.data.find(p => p.id === playerId);
      setPlayerData(player);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user is a player
    if (currentUser.role !== 'PLAYER' && !currentUser.playerId) {
      navigate('/admin-dashboard');
      return;
    }

    setUser(currentUser);
    fetchPlayerData(currentUser.playerId);
    loadClubs();
    loadChallenges(currentUser);
  }, [navigate, fetchPlayerData, loadClubs, loadChallenges]);

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
      resetSearch();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to submit join request'));
    }
  };

  const handleSearchClubs = async () => {
    if (!searchName && !searchCity && !searchSuburb) {
      setFilteredClubs(clubs);
      return;
    }
    
    setSearching(true);
    try {
      const results = await clubService.searchClubs(searchName, searchCity, searchSuburb);
      setFilteredClubs(results);
    } catch (error) {
      console.error('Error searching clubs:', error);
      alert('Error searching clubs. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchName('');
    setSearchCity('');
    setSearchSuburb('');
    setFilteredClubs(clubs);
  };

  const openJoinClubModal = () => {
    setShowJoinClubModal(true);
    loadClubs(); // Refresh clubs when opening modal
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
          <span className="username">{user?.username}</span>
          <HamburgerMenu user={user} onSignOut={handleSignOut} />
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {playerData?.name || user?.username}!</h1>
          <p>Your personal rating dashboard</p>
        </div>

        {/* Top Banner Advertisement */}
        <AdPanel placement="banner" size="medium" />

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
        {incomingChallenges.length > 0 && (
          <div className="challenges-alert">
            <div className="alert-icon">🎯</div>
            <div className="alert-content">
              <h3>Action Required!</h3>
              <p>
                <strong>{incomingChallenges.length}</strong> new challenge{incomingChallenges.length > 1 ? 's' : ''} waiting for your response
              </p>
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

        <div className="actions-container">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card" onClick={() => navigate('/rankings')}>
              <div className="action-icon">📊</div>
              <h3>View Rankings</h3>
              <p>See player standings and leaderboards</p>
            </div>
            <div className="action-card" onClick={() => navigate('/tournaments')}>
              <div className="action-icon">🏆</div>
              <h3>Tournaments</h3>
              <p>Browse and join tournaments</p>
            </div>
            <div className="action-card" onClick={() => navigate('/challenges')}>
              <div className="action-icon">⚔️</div>
              <h3>Challenge Players</h3>
              <p>Send or accept challenges</p>
            </div>
            <div className="action-card" onClick={() => navigate('/submit-match')}>
              <div className="action-icon">📝</div>
              <h3>Submit Match</h3>
              <p>Record your match results</p>
            </div>
            <div className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon">👤</div>
              <h3>Edit Profile</h3>
              <p>Update your information</p>
            </div>
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
                  <button onClick={openJoinClubModal} className="join-club-btn">
                    Join a Club
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Advertisement */}
        <div className="ad-sidebar-section">
          <AdPanel placement="sidebar" size="medium" />
        </div>
      </div>

      {/* Join Club Modal */}
      {showJoinClubModal && (
        <div className="modal-overlay" onClick={() => { setShowJoinClubModal(false); resetSearch(); }}>
          <div className="modal-content club-search-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Find & Join a Club</h2>
            
            {/* Search Filters */}
            <div className="search-section">
              <h3>Search Clubs</h3>
              <div className="search-filters">
                <div className="filter-group">
                  <label>Club Name</label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="e.g., Downtown Chess Club"
                  />
                </div>
                <div className="filter-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="e.g., Johannesburg"
                  />
                </div>
                <div className="filter-group">
                  <label>Suburb</label>
                  <input
                    type="text"
                    value={searchSuburb}
                    onChange={(e) => setSearchSuburb(e.target.value)}
                    placeholder="e.g., Sandton"
                  />
                </div>
              </div>
              <div className="search-actions">
                <button 
                  type="button" 
                  onClick={handleSearchClubs} 
                  className="search-btn"
                  disabled={searching}
                >
                  {searching ? 'Searching...' : '🔍 Search'}
                </button>
                <button 
                  type="button" 
                  onClick={resetSearch} 
                  className="reset-btn"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Club Selection Form */}
            <form onSubmit={handleJoinClub}>
              <div className="form-group">
                <label>Select Club * ({filteredClubs.length} clubs found)</label>
                <div className="clubs-list">
                  {filteredClubs.length === 0 ? (
                    <div className="no-clubs-message">
                      <p>No clubs found. Try adjusting your search filters.</p>
                    </div>
                  ) : (
                    filteredClubs.map(club => (
                      <div 
                        key={club.clubId} 
                        className={`club-option ${selectedClubId === club.clubId ? 'selected' : ''}`}
                        onClick={() => setSelectedClubId(club.clubId)}
                      >
                        <input
                          type="radio"
                          name="club"
                          value={club.clubId}
                          checked={selectedClubId === club.clubId}
                          onChange={() => setSelectedClubId(club.clubId)}
                        />
                        <div className="club-info">
                          <h4>{club.name}</h4>
                          {(club.city || club.suburb) && (
                            <p className="club-location">
                              📍 {[club.suburb, club.city].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {club.description && (
                            <p className="club-description">{club.description}</p>
                          )}
                          {club.address && (
                            <p className="club-address">🏢 {club.address}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                <button type="button" onClick={() => { setShowJoinClubModal(false); resetSearch(); }} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={!selectedClubId}>
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
