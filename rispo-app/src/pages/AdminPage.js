import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/authService';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState('unverified'); // 'all' or 'unverified'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    fetchPlayers();
  }, [filter]);

  const fetchPlayers = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = filter === 'unverified' 
        ? `${API_BASE_URL}/players/unverified`
        : `${API_BASE_URL}/players`;
      const response = await axios.get(endpoint);
      setPlayers(response.data);
    } catch (err) {
      setError('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (playerId) => {
    if (!currentUser || !currentUser.userId) {
      setError('You must be logged in to verify players');
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/players/${playerId}/verify?adminUserId=${currentUser.userId}`
      );
      alert('Player verified successfully!');
      fetchPlayers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify player');
    }
  };

  const handleUnverify = async (playerId) => {
    if (!currentUser || !currentUser.userId) {
      setError('You must be logged in to unverify players');
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/players/${playerId}/unverify?adminUserId=${currentUser.userId}`
      );
      alert('Player unverified successfully!');
      fetchPlayers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unverify player');
    }
  };

  if (!currentUser) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <h1>Access Denied</h1>
          <p>Please <a href="/login">login</a> to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'RATING_ADMIN' || currentUser.role === 'SYSTEM_ADMIN' || currentUser.role === 'CLUB_ADMIN';

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <h1>Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <h1>Player Management</h1>
          <p>Verify and manage player accounts</p>
          <div className="user-info">
            Logged in as: <strong>{currentUser.username}</strong> ({currentUser.role})
          </div>
        </div>
        <button onClick={() => navigate('/admin-dashboard')} className="back-to-dashboard-btn">
          ← Back to Dashboard
        </button>
      </div>

      <div className="admin-controls">
        <div className="filter-buttons">
          <button 
            className={filter === 'unverified' ? 'active' : ''}
            onClick={() => setFilter('unverified')}
          >
            Unverified Players
          </button>
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Players
          </button>
        </div>
        <button className="refresh-button" onClick={fetchPlayers}>
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading players...</div>
      ) : (
        <div className="players-table-container">
          <table className="players-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Matches</th>
                <th>W/L/D</th>
                <th>Status</th>
                <th>Verified By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{textAlign: 'center', padding: '40px'}}>
                    No players found
                  </td>
                </tr>
              ) : (
                players.map(player => (
                  <tr key={player.id}>
                    <td>{player.id}</td>
                    <td><strong>{player.name}</strong></td>
                    <td>{player.email || '-'}</td>
                    <td>{player.phone || '-'}</td>
                    <td><span className="rating-badge">{player.rating}</span></td>
                    <td>{player.matchesPlayed}</td>
                    <td>{player.wins}/{player.losses}/{player.draws}</td>
                    <td>
                      <span className={`status-badge ${player.isVerified ? 'verified' : 'unverified'}`}>
                        {player.isVerified ? '✓ Verified' : '⚠ Unverified'}
                      </span>
                    </td>
                    <td>{player.verifiedBy || '-'}</td>
                    <td>
                      {player.isVerified ? (
                        <button 
                          className="action-button unverify"
                          onClick={() => handleUnverify(player.id)}
                        >
                          Unverify
                        </button>
                      ) : (
                        <button 
                          className="action-button verify"
                          onClick={() => handleVerify(player.id)}
                        >
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
