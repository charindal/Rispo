import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';
import clubService from '../services/clubService';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    clubId: ''
  });
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
        name: data.name || '',
        clubId: data.clubId || ''
      });
    } catch (err) {
      setError(err.toString());
    }
  };

  const loadClubs = async () => {
    try {
      const clubsData = await clubService.getActiveClubs();
      setClubs(clubsData);
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
        name: formData.name,
        clubId: formData.clubId || null
      });

      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: profile.email || '',
      phone: profile.phone || '',
      name: profile.name || '',
      clubId: profile.clubId || ''
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
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
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

              <div className="form-group">
                <label htmlFor="clubId">Club Affiliation</label>
                <select
                  id="clubId"
                  name="clubId"
                  value={formData.clubId}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">No Club</option>
                  {clubs.map(club => (
                    <option key={club.clubId} value={club.clubId}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
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
    </div>
  );
};

export default ProfilePage;
