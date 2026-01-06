import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ratingService from '../services/ratingService';
import '../styles/RatingSettingsPage.css';

const RatingSettingsPage = () => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    provisionalGamesCount: 100,
    provisionalKFactor: 40,
    establishedKFactor: 20,
    minRating: 400,
    maxRating: 3000,
    defaultRating: 1200
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Only administrators can access
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'RATING_ADMIN' && currentUser.role !== 'CLUB_ADMIN') {
      navigate('/admin-dashboard');
      return;
    }

    setUser(currentUser);
    loadSettings();
  }, [navigate]);

  const loadSettings = async () => {
    try {
      const data = await ratingService.getSettings();
      setSettings(data);
      setFormData({
        provisionalGamesCount: data.provisionalGamesCount,
        provisionalKFactor: data.provisionalKFactor,
        establishedKFactor: data.establishedKFactor,
        minRating: data.minRating,
        maxRating: data.maxRating,
        defaultRating: data.defaultRating
      });
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value, 10)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await ratingService.updateSettings(formData, user.userId);
      setSuccess('Rating settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadSettings();
    } catch (err) {
      setError(err.toString());
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading settings...</div>;
  }

  return (
    <div className="rating-settings-page">
      <nav className="settings-navbar">
        <div className="navbar-brand">
          <h2>Rating System Configuration</h2>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/admin-dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-header">
            <h1>Rating Engine Settings</h1>
            <p>Configure the Elo rating system parameters</p>
          </div>

          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-section">
              <h2>K-Factor Configuration</h2>
              <p className="section-description">
                K-factor determines how much ratings change after each match. 
                Higher values mean bigger rating swings.
              </p>

              <div className="form-group">
                <label htmlFor="provisionalKFactor">
                  Provisional K-Factor
                  <span className="tooltip">Used for players still in provisional period</span>
                </label>
                <input
                  type="number"
                  id="provisionalKFactor"
                  name="provisionalKFactor"
                  value={formData.provisionalKFactor}
                  onChange={handleChange}
                  min="10"
                  max="100"
                  required
                  disabled={saving}
                />
                <small>Recommended: 40 (higher K-factor for faster rating adjustment)</small>
              </div>

              <div className="form-group">
                <label htmlFor="establishedKFactor">
                  Established K-Factor
                  <span className="tooltip">Used for established players</span>
                </label>
                <input
                  type="number"
                  id="establishedKFactor"
                  name="establishedKFactor"
                  value={formData.establishedKFactor}
                  onChange={handleChange}
                  min="5"
                  max="50"
                  required
                  disabled={saving}
                />
                <small>Recommended: 20 (standard K-factor for stable ratings)</small>
              </div>

              <div className="form-group">
                <label htmlFor="provisionalGamesCount">
                  Provisional Games Count
                  <span className="tooltip">Number of games before a player is "established"</span>
                </label>
                <input
                  type="number"
                  id="provisionalGamesCount"
                  name="provisionalGamesCount"
                  value={formData.provisionalGamesCount}
                  onChange={handleChange}
                  min="10"
                  max="500"
                  required
                  disabled={saving}
                />
                <small>Number of games a player must complete before using established K-factor</small>
              </div>
            </div>

            <div className="form-section">
              <h2>Rating Boundaries</h2>
              <p className="section-description">
                Set minimum and maximum rating limits to keep ratings within reasonable bounds.
              </p>

              <div className="form-group">
                <label htmlFor="minRating">Minimum Rating</label>
                <input
                  type="number"
                  id="minRating"
                  name="minRating"
                  value={formData.minRating}
                  onChange={handleChange}
                  min="100"
                  max="1000"
                  required
                  disabled={saving}
                />
                <small>Lowest possible rating a player can have</small>
              </div>

              <div className="form-group">
                <label htmlFor="maxRating">Maximum Rating</label>
                <input
                  type="number"
                  id="maxRating"
                  name="maxRating"
                  value={formData.maxRating}
                  onChange={handleChange}
                  min="2000"
                  max="5000"
                  required
                  disabled={saving}
                />
                <small>Highest possible rating a player can have</small>
              </div>

              <div className="form-group">
                <label htmlFor="defaultRating">Default Starting Rating</label>
                <input
                  type="number"
                  id="defaultRating"
                  name="defaultRating"
                  value={formData.defaultRating}
                  onChange={handleChange}
                  min="400"
                  max="2000"
                  required
                  disabled={saving}
                />
                <small>Initial rating for new players</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button 
                type="button" 
                className="reset-btn"
                onClick={loadSettings}
                disabled={saving}
              >
                Reset Changes
              </button>
            </div>
          </form>

          {settings && settings.updatedBy && (
            <div className="settings-footer">
              <p>Last updated by: {settings.updatedBy}</p>
              {settings.updatedAt && <p>on {new Date(settings.updatedAt).toLocaleString()}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingSettingsPage;
