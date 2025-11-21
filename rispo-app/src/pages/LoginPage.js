import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    userId: null,
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await authService.login(username, password);
      
      // Check if user must change password
      if (userData.mustChangePassword) {
        setPasswordChangeData({
          userId: userData.userId,
          oldPassword: password,
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordChange(true);
        setLoading(false);
        return;
      }
      
      // Route based on user role and player profile
      if (userData.role === 'SUPER_USER' || userData.role === 'SYSTEM_ADMIN' || userData.role === 'RATING_ADMIN' || userData.role === 'CLUB_ADMIN') {
        // If admin has a player profile, go to player dashboard, otherwise admin dashboard
        if (userData.playerId) {
          navigate('/player-dashboard');
        } else {
          navigate('/admin-dashboard');
        }
      } else {
        navigate('/player-dashboard');
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (passwordChangeData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(passwordChangeData.userId, {
        oldPassword: passwordChangeData.oldPassword,
        newPassword: passwordChangeData.newPassword
      });

      alert('Password changed successfully! Please login with your new password.');
      setShowPasswordChange(false);
      setPassword('');
      setPasswordChangeData({
        userId: null,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Rispo</h1>
          <p>Rating System Platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <h2 style={{color: '#e74c3c', marginBottom: '10px'}}>⚠️ Password Change Required</h2>
            <p style={{marginBottom: '20px', color: '#666'}}>
              You must change your password before continuing. Please choose a secure password.
            </p>
            
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordChangeData.newPassword}
                  onChange={(e) => setPasswordChangeData({...passwordChangeData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordChangeData.confirmPassword}
                  onChange={(e) => setPasswordChangeData({...passwordChangeData, confirmPassword: e.target.value})}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div style={{marginTop: '20px'}}>
                <button 
                  type="submit" 
                  className="login-button"
                  disabled={loading}
                  style={{width: '100%'}}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
