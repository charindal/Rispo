import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import clubService from '../services/clubService';
import '../styles/ClubManagement.css';

function ClubManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showCreateClubForm, setShowCreateClubForm] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [tokenForm, setTokenForm] = useState({
    clubId: '',
    role: 'CLUB_ADMIN',
    validityDays: 30
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'CLUB_ADMIN') {
      navigate('/admin-dashboard');
      return;
    }

    setUser(currentUser);
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [clubsData, tokensData, requestsData] = await Promise.all([
        clubService.getAllClubs(),
        clubService.getUnusedTokens(),
        clubService.getPendingJoinRequests()
      ]);
      
      setClubs(clubsData);
      setTokens(tokensData);
      setJoinRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await clubService.createClub(clubForm, user.userId);
      alert('Club created successfully!');
      setShowCreateClubForm(false);
      setClubForm({ name: '', description: '', address: '', contactEmail: '', contactPhone: '' });
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    try {
      const token = await clubService.generateToken(tokenForm, user.userId);
      alert(`Token generated successfully!\n\nToken: ${token.token}\n\nShare this token with the admin to register.`);
      setShowTokenForm(false);
      setTokenForm({ clubId: '', role: 'CLUB_ADMIN', validityDays: 30 });
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleReviewRequest = async (requestId, status) => {
    try {
      await clubService.reviewJoinRequest(requestId, status, '', user.userId);
      alert(`Request ${status.toLowerCase()} successfully!`);
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleUpdateClubStatus = async (clubId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this club?`)) {
      return;
    }
    try {
      await clubService.updateClubStatus(clubId, status, user.userId);
      alert('Club status updated!');
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading || !user) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="club-management">
      <nav className="management-navbar">
        <div className="navbar-brand">
          <h2>🏢 Club Management</h2>
          <span className="admin-badge">System Admin</span>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/admin-dashboard')} className="back-btn">
            ← Dashboard
          </button>
          <button onClick={() => { authService.logout(); navigate('/login'); }} className="signout-btn">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="management-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'clubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            Clubs ({clubs.length})
          </button>
          <button 
            className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveTab('tokens')}
          >
            Admin Tokens ({tokens.length})
          </button>
          <button 
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Join Requests ({joinRequests.length})
          </button>
        </div>

        {/* Clubs Tab */}
        {activeTab === 'clubs' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Clubs & Venues</h2>
              <button onClick={() => setShowCreateClubForm(!showCreateClubForm)} className="primary-btn">
                {showCreateClubForm ? 'Cancel' : '+ Create Club'}
              </button>
            </div>

            {showCreateClubForm && (
              <div className="form-card">
                <h3>Create New Club</h3>
                <form onSubmit={handleCreateClub}>
                  <div className="form-group">
                    <label>Club Name *</label>
                    <input
                      type="text"
                      value={clubForm.name}
                      onChange={(e) => setClubForm({...clubForm, name: e.target.value})}
                      placeholder="e.g., Downtown Chess Club"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={clubForm.description}
                      onChange={(e) => setClubForm({...clubForm, description: e.target.value})}
                      placeholder="Brief description of the club"
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={clubForm.address}
                      onChange={(e) => setClubForm({...clubForm, address: e.target.value})}
                      placeholder="Physical address"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Email</label>
                      <input
                        type="email"
                        value={clubForm.contactEmail}
                        onChange={(e) => setClubForm({...clubForm, contactEmail: e.target.value})}
                        placeholder="club@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone</label>
                      <input
                        type="tel"
                        value={clubForm.contactPhone}
                        onChange={(e) => setClubForm({...clubForm, contactPhone: e.target.value})}
                        placeholder="+27 123 456 7890"
                      />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn">Create Club</button>
                </form>
              </div>
            )}

            <div className="clubs-grid">
              {clubs.map(club => (
                <div key={club.clubId} className="club-card">
                  <div className="club-header">
                    <h3>{club.name}</h3>
                    <span className={`status-badge ${club.status.toLowerCase()}`}>
                      {club.status}
                    </span>
                  </div>
                  <div className="club-details">
                    {club.description && <p>{club.description}</p>}
                    {club.address && <p><strong>📍</strong> {club.address}</p>}
                    {club.contactEmail && <p><strong>📧</strong> {club.contactEmail}</p>}
                    {club.contactPhone && <p><strong>📞</strong> {club.contactPhone}</p>}
                    <p className="club-meta">Created by {club.createdByUsername}</p>
                  </div>
                  <div className="club-actions">
                    {club.status === 'ACTIVE' && (
                      <>
                        <button 
                          onClick={() => handleUpdateClubStatus(club.clubId, 'INACTIVE')}
                          className="action-btn warning"
                        >
                          Deactivate
                        </button>
                        <button 
                          onClick={() => handleUpdateClubStatus(club.clubId, 'SUSPENDED')}
                          className="action-btn danger"
                        >
                          Suspend
                        </button>
                      </>
                    )}
                    {club.status !== 'ACTIVE' && (
                      <button 
                        onClick={() => handleUpdateClubStatus(club.clubId, 'ACTIVE')}
                        className="action-btn success"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Admin Registration Tokens</h2>
              <button onClick={() => setShowTokenForm(!showTokenForm)} className="primary-btn">
                {showTokenForm ? 'Cancel' : '+ Generate Token'}
              </button>
            </div>

            {showTokenForm && (
              <div className="form-card">
                <h3>Generate Admin Token</h3>
                <form onSubmit={handleGenerateToken}>
                  <div className="form-group">
                    <label>Club *</label>
                    <select
                      value={tokenForm.clubId}
                      onChange={(e) => setTokenForm({...tokenForm, clubId: e.target.value})}
                      required
                    >
                      <option value="">Select Club</option>
                      {clubs.filter(c => c.status === 'ACTIVE').map(club => (
                        <option key={club.clubId} value={club.clubId}>{club.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Admin Role *</label>
                    <select
                      value={tokenForm.role}
                      onChange={(e) => setTokenForm({...tokenForm, role: e.target.value})}
                      required
                    >
                      <option value="CLUB_ADMIN">Club Admin</option>
                      <option value="RATING_ADMIN">Rating Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valid For (Days) *</label>
                    <input
                      type="number"
                      value={tokenForm.validityDays}
                      onChange={(e) => setTokenForm({...tokenForm, validityDays: parseInt(e.target.value)})}
                      min="1"
                      max="365"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">Generate Token</button>
                </form>
              </div>
            )}

            <div className="tokens-table">
              <table>
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Club</th>
                    <th>Role</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(token => (
                    <tr key={token.tokenId}>
                      <td><code>{token.token.substring(0, 20)}...</code></td>
                      <td>{token.clubName}</td>
                      <td>{token.role}</td>
                      <td>{new Date(token.expiresAt).toLocaleDateString()}</td>
                      <td>
                        <span className="status-badge active">Available</span>
                      </td>
                    </tr>
                  ))}
                  {tokens.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>
                        No unused tokens
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Join Requests Tab */}
        {activeTab === 'requests' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Pending Club Join Requests</h2>
            </div>

            <div className="requests-table">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Club</th>
                    <th>Message</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map(request => (
                    <tr key={request.requestId}>
                      <td><strong>{request.playerName}</strong></td>
                      <td>{request.clubName}</td>
                      <td>{request.message || '-'}</td>
                      <td>{new Date(request.requestedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleReviewRequest(request.requestId, 'APPROVED')}
                            className="action-btn success"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReviewRequest(request.requestId, 'REJECTED')}
                            className="action-btn danger"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {joinRequests.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>
                        No pending requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClubManagement;
