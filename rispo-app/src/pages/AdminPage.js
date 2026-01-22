import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../services/authService';
import clubService from '../services/clubService';
import Pagination from '../components/Pagination';
import '../styles/AdminPage.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState('unverified'); // 'all' or 'unverified'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const currentUser = authService.getCurrentUser();

  // Token generation state
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [tokenForm, setTokenForm] = useState({
    clubId: '',
    role: currentUser?.role === 'SUPER_USER' ? 'SYSTEM_ADMIN' : 'CLUB_ADMIN',
    validityDays: 30
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = filter === 'unverified' 
        ? `${API_BASE_URL}/players/unverified`
        : `${API_BASE_URL}/players`;
      const response = await axios.get(endpoint);
      setPlayers(response.data);
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, [filter, API_BASE_URL]);

  useEffect(() => {
    fetchPlayers();
    fetchTokens();
  }, [fetchPlayers]);

  const fetchTokens = async () => {
    if (!currentUser || (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'SYSTEM_ADMIN')) {
      return;
    }
    try {
      const tokensData = currentUser.role === 'SYSTEM_ADMIN' 
        ? await clubService.getMyTokens(currentUser.userId)
        : await clubService.getUnusedTokens();
      setTokens(tokensData || []);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    }
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    try {
      const token = await clubService.generateToken(tokenForm, currentUser.userId);
      alert(`Token generated successfully!\n\nToken: ${token.token}\n\nShare this token with the admin to register.`);
      setShowTokenForm(false);
      // Reset form with appropriate default role based on user
      const defaultRole = currentUser.role === 'SUPER_USER' ? 'SYSTEM_ADMIN' : 'CLUB_ADMIN';
      setTokenForm({ clubId: '', role: defaultRole, validityDays: 30 });
      fetchTokens();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to generate token'));
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

  const isAdmin = currentUser.role === 'SUPER_USER' || currentUser.role === 'SYSTEM_ADMIN' || currentUser.role === 'RATING_ADMIN' || currentUser.role === 'CLUB_ADMIN';

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

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlayers = players.slice(startIndex, endIndex);

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
          🏠 Home
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
        <>
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
                  paginatedPlayers.map(player => (
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
          <Pagination
            currentPage={currentPage}
            totalItems={players.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Token Generation Section - Only for SUPER_USER and SYSTEM_ADMIN */}
      {(currentUser.role === 'SUPER_USER' || currentUser.role === 'SYSTEM_ADMIN') && (
        <div className="token-section">
          <div className="section-header">
            <h2>🔑 Admin Registration Tokens</h2>
            <button onClick={() => setShowTokenForm(!showTokenForm)} className="generate-token-btn">
              {showTokenForm ? 'Cancel' : '+ Generate Token'}
            </button>
          </div>

          {showTokenForm && (
            <div className="token-form-card">
              <h3>Generate Admin Token</h3>
              <form onSubmit={handleGenerateToken}>
                <div className="form-group">
                  <label>Admin Role *</label>
                  <select
                    value={tokenForm.role}
                    onChange={(e) => setTokenForm({...tokenForm, role: e.target.value})}
                    required
                  >
                    {currentUser.role === 'SUPER_USER' && (
                      <option value="SYSTEM_ADMIN">System Admin</option>
                    )}
                    {currentUser.role === 'SYSTEM_ADMIN' && (
                      <>
                        <option value="CLUB_ADMIN">Club Admin</option>
                        <option value="RATING_ADMIN">Rating Admin</option>
                      </>
                    )}
                  </select>
                  <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                    {currentUser.role === 'SUPER_USER' ? 'System Admins manage the platform' : 'Admins assigned to clubs during registration'}
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Valid For (Days) *</label>
                  <input
                    type="number"
                    value={tokenForm.validityDays}
                    onChange={(e) => setTokenForm({...tokenForm, validityDays: parseInt(e.target.value) || 30})}
                    min="1"
                    max="365"
                    required
                  />
                </div>
                <button type="submit" className="submit-btn">Generate Token</button>
              </form>
            </div>
          )}

          <div className="tokens-table-container">
            <table className="tokens-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tokens.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '40px'}}>
                      No unused tokens
                    </td>
                  </tr>
                ) : (
                  tokens.map(token => (
                    <tr key={token.tokenId}>
                      <td><code>{token.token?.substring(0, 20)}...</code></td>
                      <td>{token.role}</td>
                      <td>{token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className="status-badge verified">Available</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
