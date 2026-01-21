import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import clubService from '../services/clubService';
import '../styles/RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nationalId: '',
    name: '',
    phone: '',
    role: 'PLAYER',
    clubId: '',
    adminToken: '',
    createPlayerProfile: false,
    // Club creation fields
    clubName: '',
    clubDescription: '',
    clubAddress: '',
    clubCity: '',
    clubSuburb: '',
    clubContactEmail: '',
    clubContactPhone: ''
  });
  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClubSearch, setShowClubSearch] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchSuburb, setSearchSuburb] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // Check if mandatory fields are filled
  const isMandatoryFieldsFilled = () => {
    const basicFields = formData.username && formData.password && formData.confirmPassword && 
                       formData.nationalId && formData.name;
    
    if (isAdminRole && !formData.adminToken) {
      return false;
    }
    
    if (formData.role === 'CLUB_ADMIN' && !formData.clubName) {
      return false;
    }
    
    return basicFields;
  };

  useEffect(() => {
    // Load active clubs
    const fetchClubs = async () => {
      try {
        const clubsData = await clubService.getActiveClubs();
        setClubs(clubsData);
        setFilteredClubs(clubsData);
      } catch (err) {
        console.error('Error loading clubs:', err);
      }
    };
    fetchClubs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate club creation for CLUB_ADMIN
    if (formData.role === 'CLUB_ADMIN') {
      if (!formData.clubName || formData.clubName.trim() === '') {
        setError('Club name is required for Club Admin registration');
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare registration data
      const registrationData = {
        username: formData.username,
        password: formData.password,
        email: formData.email || null,
        nationalId: formData.nationalId,
        name: formData.name,
        phone: formData.phone || null,
        role: formData.role,
        clubId: formData.clubId || null,
        adminToken: formData.adminToken || null,
        createPlayerProfile: formData.createPlayerProfile
      };

      // Add club creation data for CLUB_ADMIN
      if (formData.role === 'CLUB_ADMIN') {
        registrationData.clubName = formData.clubName;
        registrationData.clubDescription = formData.clubDescription;
        registrationData.clubAddress = formData.clubAddress;
        registrationData.clubCity = formData.clubCity;
        registrationData.clubSuburb = formData.clubSuburb;
        registrationData.clubContactEmail = formData.clubContactEmail;
        registrationData.clubContactPhone = formData.clubContactPhone;
      }

      await authService.register(registrationData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Registration failed. Please try again.');
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

  const selectClub = (clubId) => {
    setFormData({ ...formData, clubId });
    setShowClubSearch(false);
    resetSearch();
  };

  const isAdminRole = formData.role === 'SYSTEM_ADMIN' || formData.role === 'CLUB_ADMIN' || formData.role === 'RATING_ADMIN';
  const requiresClub = formData.role === 'CLUB_ADMIN' || formData.role === 'RATING_ADMIN';

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join the Rispo community</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          {/* Register Button at Top */}
          <div className="register-action-top">
            <button
              type="submit"
              className={`register-btn ${isMandatoryFieldsFilled() ? 'enabled' : 'disabled'}`}
              disabled={loading || !isMandatoryFieldsFilled()}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
            {!isMandatoryFieldsFilled() && (
              <small className="register-hint">Fill required fields to enable registration</small>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Mandatory Fields Section */}
          <div className="form-section">
            <h3 className="section-title">Required Information</h3>
            
            <div className="form-group">
              <label htmlFor="username">Username/Nickname *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username or nickname"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nationalId">National ID / Passport *</label>
              <input
                type="text"
                id="nationalId"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="Enter your ID or passport number"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="PLAYER">Player</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
                <option value="CLUB_ADMIN">Club Admin</option>
                <option value="RATING_ADMIN">Rating Admin</option>
              </select>
              <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                {isAdminRole ? 'Admin roles require a valid registration token' : 'Regular player account'}
              </small>
            </div>

            {isAdminRole && (
              <div className="form-group">
                <label htmlFor="adminToken">Admin Registration Token *</label>
                <input
                  type="text"
                  id="adminToken"
                  name="adminToken"
                  value={formData.adminToken}
                  onChange={handleChange}
                  placeholder="Enter your admin token"
                  required={isAdminRole}
                  disabled={loading}
                />
                <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                  Contact a system admin to obtain a registration token
                </small>
              </div>
            )}
          </div>

          {/* Club Creation Section for CLUB_ADMIN */}
          {formData.role === 'CLUB_ADMIN' && (
            <div className="form-section club-creation-section">
              <h3 className="section-title">🏛️ Create Your Club *</h3>
              <p className="section-description">
                As a Club Admin, you must create your club during registration.
              </p>

              <div className="form-group">
                <label htmlFor="clubName">Club Name *</label>
                <input
                  type="text"
                  id="clubName"
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleChange}
                  placeholder="Enter club name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="clubDescription">Club Description</label>
                <textarea
                  id="clubDescription"
                  name="clubDescription"
                  value={formData.clubDescription}
                  onChange={handleChange}
                  placeholder="Describe your club (optional)"
                  rows="3"
                  disabled={loading}
                  style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>

              <div className="form-group">
                <label htmlFor="clubAddress">Address</label>
                <input
                  type="text"
                  id="clubAddress"
                  name="clubAddress"
                  value={formData.clubAddress}
                  onChange={handleChange}
                  placeholder="Street address (optional)"
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clubCity">City</label>
                  <input
                    type="text"
                    id="clubCity"
                    name="clubCity"
                    value={formData.clubCity}
                    onChange={handleChange}
                    placeholder="City (optional)"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clubSuburb">Suburb</label>
                  <input
                    type="text"
                    id="clubSuburb"
                    name="clubSuburb"
                    value={formData.clubSuburb}
                    onChange={handleChange}
                    placeholder="Suburb (optional)"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clubContactEmail">Club Contact Email</label>
                  <input
                    type="email"
                    id="clubContactEmail"
                    name="clubContactEmail"
                    value={formData.clubContactEmail}
                    onChange={handleChange}
                    placeholder="Leave blank to use your email"
                    disabled={loading}
                  />
                  <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                    {!formData.clubContactEmail ? `Will use: ${formData.email || 'your email'}` : ''}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="clubContactPhone">Club Contact Phone</label>
                  <input
                    type="tel"
                    id="clubContactPhone"
                    name="clubContactPhone"
                    value={formData.clubContactPhone}
                    onChange={handleChange}
                    placeholder="Leave blank to use your phone"
                    disabled={loading}
                  />
                  <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                    {!formData.clubContactPhone ? `Will use: ${formData.phone || 'your phone'}` : ''}
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Club Selection for other roles */}
          {formData.role !== 'CLUB_ADMIN' && (
            <div className="form-group">
              <label htmlFor="clubId">Club Affiliation (Optional)</label>
              <div className="club-selection">
                <input
                  type="text"
                  value={clubs.find(c => c.clubId === formData.clubId)?.name || ''}
                  placeholder="Click 'Search Clubs' to find a club"
                  readOnly
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowClubSearch(true)}
                  className="search-club-btn"
                  disabled={loading}
                >
                  Search Clubs
                </button>
                {formData.clubId && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, clubId: '' })}
                    className="clear-club-btn"
                    disabled={loading}
                  >
                    Clear
                  </button>
                )}
              </div>
              <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                {formData.role === 'PLAYER' ? 'You can join a club during registration or later' : 
                 formData.role === 'SYSTEM_ADMIN' ? 'System admins are not affiliated with clubs' :
                 'Select your affiliated club'}
              </small>
            </div>
          )}

          {/* Optional Fields Section */}
          <div className="form-section optional-section">
            <h3 className="section-title">Optional Information</h3>
            <p className="section-description">
              These fields are optional but help us provide a better experience.
            </p>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                disabled={loading}
              />
              <small>For notifications and account recovery</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+27 123 456 7890"
                disabled={loading}
              />
              <small>For account verification and important updates</small>
            </div>
          </div>

          {isAdminRole && (
            <div className="form-section">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="createPlayerProfile"
                    checked={formData.createPlayerProfile}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Also create a player profile for me</span>
                </label>
                <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                  Admins can also have player profiles to participate in matches
                </small>
              </div>
            </div>
          )}

        </form>

        <div className="register-footer">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>

      {/* Club Search Modal */}
      {showClubSearch && (
        <div className="modal-overlay" onClick={() => { setShowClubSearch(false); resetSearch(); }}>
          <div className="modal-content club-search-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Find a Club</h2>
            
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
                      className="club-option"
                      onClick={() => selectClub(club.clubId)}
                    >
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
                      <button className="select-btn">Select</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => { setShowClubSearch(false); resetSearch(); }} 
              className="close-modal-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
