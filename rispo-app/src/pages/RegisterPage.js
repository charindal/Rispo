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
    createPlayerProfile: false
  });
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load active clubs
    const fetchClubs = async () => {
      try {
        const clubsData = await clubService.getActiveClubs();
        setClubs(clubsData);
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
      // Prepare registration data
      const registrationData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        nationalId: formData.nationalId,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        clubId: formData.clubId || null,
        adminToken: formData.adminToken || null,
        createPlayerProfile: formData.createPlayerProfile
      };

      await authService.register(registrationData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const isAdminRole = formData.role === 'CLUB_ADMIN' || formData.role === 'RATING_ADMIN';

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join the Rispo community</p>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
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

          <div className="form-row">
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
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+27 123 456 7890"
                required
                disabled={loading}
              />
            </div>
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
              <option value="CLUB_ADMIN">Club Admin</option>
              <option value="RATING_ADMIN">Rating Admin</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
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

          <div className="form-group">
            <label htmlFor="clubId">Club Affiliation (Optional)</label>
            <select
              id="clubId"
              name="clubId"
              value={formData.clubId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">No Club / Register Later</option>
              {clubs.map(club => (
                <option key={club.clubId} value={club.clubId}>
                  {club.name}
                </option>
              ))}
            </select>
            <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
              {formData.role === 'PLAYER' ? 'Players without clubs may take longer to verify' : 'Select your affiliated club'}
            </small>
          </div>

          {isAdminRole && (
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
          )}

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
