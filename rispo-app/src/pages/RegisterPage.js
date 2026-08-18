import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
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
    adminToken: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isMandatoryFieldsFilled = () =>
    formData.username && formData.password && formData.confirmPassword &&
    formData.nationalId && formData.name;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email || null,
        nationalId: formData.nationalId,
        name: formData.name,
        phone: formData.phone || null,
        role: formData.role
      };
      if (formData.role === 'SYSTEM_ADMIN') {
        payload.adminToken = formData.adminToken;
      }
      await authService.register(payload);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join the Rispo community</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
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

          <div className="form-section">
            <h3 className="section-title">Account Type</h3>

            <div className="form-group">
              <label htmlFor="role">Register as</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="PLAYER">Player</option>
                <option value="SYSTEM_ADMIN">Administrator</option>
              </select>
            </div>

            {formData.role === 'SYSTEM_ADMIN' && (
              <div className="form-group">
                <label htmlFor="adminToken">Admin Registration Token *</label>
                <input
                  type="password"
                  id="adminToken"
                  name="adminToken"
                  value={formData.adminToken}
                  onChange={handleChange}
                  placeholder="Enter the admin registration token"
                  required
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="section-title">Required Information</h3>

            <div className="form-group">
              <label htmlFor="username">Username / Nickname *</label>
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
          </div>

          <div className="form-section optional-section">
            <h3 className="section-title">Optional Information</h3>

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
        </form>

        <div className="register-footer">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;