import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';
import clubService from '../services/clubService';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: ''
  });
  const [showClubSearch, setShowClubSearch] = useState(false);
  const [selectedNewClub, setSelectedNewClub] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchSuburb, setSearchSuburb] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadProfile(currentUser.userId);
    loadClubs();
  }, [navigate]);

  const loadProfile = async (userId) => {
    try {
      const data = await userService.getUserProfile(userId);
      setProfile(data);
      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        name: data.name || ''
      });
    } catch (err) {
      setError(err.toString());
    }
  };

  const loadClubs = async () => {
    try {
      const clubsData = await clubService.getActiveClubs();
      setClubs(clubsData);
      setFilteredClubs(clubsData);
    } catch (err) {
      console.error('Error loading clubs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || formData.email.trim() === '') {
      setError('Email is required');
      return;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      setError('Phone number is required');
      return;
    }

    setLoading(true);

    try {
      const updatedProfile = await userService.updateProfile(profile.userId, {
        email: formData.email,
        phone: formData.phone,
        name: formData.name
      });

      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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

  const handleRequestClubChange = async () => {
    if (!selectedNewClub) {
      alert('Please select a club');
      return;
    }

    try {
      await clubService.requestToJoinClub(selectedNewClub, joinMessage, profile.playerId);
      alert('Club join request submitted! An admin will review your request.');
      setShowClubSearch(false);
      setSelectedNewClub(null);
      setJoinMessage('');
      resetSearch();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to submit join request'));
    }
  };

  const handleCancel = () => {
    setFormData({
      email: profile.email || '',
      phone: profile.phone || '',
      name: profile.name || ''
    });
    setIsEditing(false);
    setError('');
  };

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
          <div className="header-actions">
            <button 
              className="rankings-button"
              onClick={() => navigate('/rankings')}
            >
              📊 Rankings
            </button>
            <button 
              className="back-button"
              onClick={() => navigate('/player-dashboard')}
            >
              🏠 Home
            </button>
          </div>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-section">
              <h2>Account Information</h2>
              <div className="profile-field">
                <label>Username</label>
                <p>{profile.username}</p>
              </div>
              <div className="profile-field">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>
              <div className="profile-field">
                <label>National ID</label>
                <p>{profile.nationalId}</p>
              </div>
              <div className="profile-field">
                <label>Role</label>
                <p>{profile.role}</p>
              </div>
              <div className="profile-field">
                <label>Club</label>
                <p>{profile.clubName || 'Not affiliated'}</p>
              </div>
            </div>

            {profile.playerId && (
              <div className="profile-section">
                <h2>Player Information</h2>
                <div className="profile-field">
                  <label>Name</label>
                  <p>{profile.name}</p>
                </div>
                <div className="profile-field">
                  <label>Phone</label>
                  <p>{profile.phone}</p>
                </div>
                <div className="profile-field">
                  <label>Rating</label>
                  <p>{profile.rating}</p>
                </div>
                <div className="profile-field">
                  <label>Verification Status</label>
                  <p className={profile.isVerified ? 'verified' : 'unverified'}>
                    {profile.isVerified ? '✓ Verified' : '✗ Not Verified'}
                  </p>
                </div>
              </div>
            )}

            <button 
              className="edit-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="profile-section">
              <h2>Edit Contact Information</h2>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {profile.playerId && (
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {profile.playerId && (
                <div className="form-group">
                  <label>Current Club</label>
                  <div className="club-change-section">
                    <input
                      type="text"
                      value={profile.clubName || 'No club'}
                      readOnly
                      disabled
                    />
                    <button
                      type="button"
                      onClick={() => setShowClubSearch(true)}
                      className="change-club-btn"
                      disabled={loading}
                    >
                      {profile.clubName ? 'Change Club' : 'Join Club'}
                    </button>
                  </div>
                  <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                    Changing clubs requires admin approval
                  </small>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button"
                className="cancel-button"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Club Search Modal */}
      {showClubSearch && (
        <div className="modal-overlay" onClick={() => { setShowClubSearch(false); resetSearch(); setSelectedNewClub(null); }}>
          <div className="modal-content club-search-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Request to Join a Club</h2>
            <p style={{color: '#666', marginBottom: '20px'}}>Changing clubs requires admin approval. Search for a club below.</p>
            
            <div className="search-section">
              <h3>Search by Location</h3>
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

            <div className="clubs-results">
              <h3>Select a Club ({filteredClubs.length} found)</h3>
              <div className="clubs-list">
                {filteredClubs.length === 0 ? (
                  <div className="no-clubs-message">
                    <p>No clubs found. Try adjusting your search filters.</p>
                  </div>
                ) : (
                  filteredClubs.map(club => (
                    <div 
                      key={club.clubId} 
                      className={`club-option ${selectedNewClub === club.clubId ? 'selected' : ''}`}
                      onClick={() => setSelectedNewClub(club.clubId)}
                    >
                      <input
                        type="radio"
                        name="newClub"
                        checked={selectedNewClub === club.clubId}
                        onChange={() => setSelectedNewClub(club.clubId)}
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
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => { setShowClubSearch(false); resetSearch(); setSelectedNewClub(null); }} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleRequestClubChange} 
                className="submit-btn"
                disabled={!selectedNewClub}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
