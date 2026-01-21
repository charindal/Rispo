import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import clubService from '../services/clubService';
import tournamentService from '../services/tournamentService';
import Pagination from '../components/Pagination';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/ClubManagement.css';

function ClubManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('clubs');
  const [clubs, setClubs] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [clubsPage, setClubsPage] = useState(1);
  const [tokensPage, setTokensPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const itemsPerPage = 20;
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClubs, setFilteredClubs] = useState([]);
  
  // Form states
  const [showCreateClubForm, setShowCreateClubForm] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    suburb: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [playerHistory, setPlayerHistory] = useState([]);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [tokenForm, setTokenForm] = useState({
    clubId: '',
    role: '',
    validityDays: 30
  });

  // Club Tournament Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubTournaments, setClubTournaments] = useState([]);
  const [tournamentTemplates, setTournamentTemplates] = useState([]);
  const [showCreateTournamentForm, setShowCreateTournamentForm] = useState(false);
  const [tournamentForm, setTournamentForm] = useState({
    templateId: '',
    name: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'CLUB_ADMIN' && currentUser.role !== 'RATING_ADMIN') {
      navigate('/admin-dashboard');
      return;
    }

    setUser(currentUser);
    
    // Initialize token form role based on user's role
    if (currentUser.role === 'SUPER_USER') {
      setTokenForm(prev => ({ ...prev, role: 'SYSTEM_ADMIN' }));
    } else if (currentUser.role === 'SYSTEM_ADMIN') {
      setTokenForm(prev => ({ ...prev, role: 'CLUB_ADMIN' }));
    }
    
    loadData();
  }, [navigate]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredClubs(clubs);
      return;
    }
    
    const searchTerms = query.toLowerCase().trim().split(' ');
    const filtered = clubs.filter(club => {
      const searchableText = [
        club.name,
        club.address,
        club.city,
        club.suburb,
        club.description
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
    
    setFilteredClubs(filtered);
  }, [clubs]);

  const loadData = useCallback(async () => {
    try {
      const clubsDataPromise = clubService.getAllClubs();
      const requestsDataPromise = clubService.getPendingJoinRequests();
      
      // SYSTEM_ADMIN sees only their own tokens, SUPER_USER sees all
      const tokensDataPromise = user && user.role === 'SYSTEM_ADMIN' 
        ? clubService.getMyTokens(user.userId)
        : clubService.getUnusedTokens();
      
      const [clubsData, tokensData, requestsData] = await Promise.all([
        clubsDataPromise,
        tokensDataPromise,
        requestsDataPromise
      ]);
      
      setClubs(clubsData);
      setFilteredClubs(clubsData);
      setTokens(tokensData);
      setJoinRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }, [user]);

  // Reset clubs page when search changes
  React.useEffect(() => {
    setClubsPage(1);
  }, [searchQuery]);

  // Update filtered clubs when clubs data changes
  React.useEffect(() => {
    if (clubs.length > 0) {
      handleSearch(searchQuery);
    }
  }, [clubs, searchQuery, handleSearch]);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await clubService.createClub(clubForm, user.userId);
      alert('Club created successfully!');
      setShowCreateClubForm(false);
      setClubForm({ name: '', description: '', address: '', city: '', suburb: '', contactEmail: '', contactPhone: '' });
      loadData();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to create club'));
    }
  };

  // handleEditClub removed - functionality moved to ClubDashboard

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    try {
      await clubService.updateClub(editingClub.clubId, clubForm, user.userId);
      alert('Club updated successfully!');
      setEditingClub(null);
      setClubForm({ name: '', description: '', address: '', city: '', suburb: '', contactEmail: '', contactPhone: '' });
      loadData();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to update club'));
    }
  };

  const handleCancelEdit = () => {
    setEditingClub(null);
    setClubForm({ name: '', description: '', address: '', city: '', suburb: '', contactEmail: '', contactPhone: '' });
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    try {
      const token = await clubService.generateToken(tokenForm, user.userId);
      alert(`Token generated successfully!\n\nToken: ${token.token}\n\nShare this token with the admin to register.`);
      setShowTokenForm(false);
      // Reset form with appropriate default role based on user
      const defaultRole = user.role === 'SUPER_USER' ? 'SYSTEM_ADMIN' : 'CLUB_ADMIN';
      setTokenForm({ clubId: '', role: defaultRole, validityDays: 30 });
      loadData();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to generate token'));
    }
  };

  const openReviewModal = async (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setRejectionReason('');
    
    // Fetch player history
    try {
      const history = await clubService.getPlayerJoinRequestHistory(request.playerId);
      setPlayerHistory(history);
    } catch (error) {
      console.error('Failed to load player history:', error);
      setPlayerHistory([]);
    }
    
    setShowReviewModal(true);
  };

  const handleReviewRequest = async () => {
    // Validate rejection reason
    if (reviewAction === 'REJECTED' && (!rejectionReason || rejectionReason.trim() === '')) {
      alert('Rejection reason is mandatory');
      return;
    }
    
    try {
      await clubService.reviewJoinRequest(
        selectedRequest.requestId,
        reviewAction,
        rejectionReason || '',
        user.userId
      );
      alert(`Request ${reviewAction.toLowerCase()} successfully!`);
      setShowReviewModal(false);
      setSelectedRequest(null);
      setPlayerHistory([]);
      loadData();
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to review request'));
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
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to update status'));
    }
  };

  // Club Tournament Handlers
  const handleClubClick = (club) => {
    navigate(`/clubs/${club.clubId}`);
  };

  const handleManageTournaments = async (club) => {
    setSelectedClub(club);
    setShowTournamentModal(true);
    try {
      const [tournamentsResp, templatesResp] = await Promise.all([
        tournamentService.getClubTournaments(club.clubId),
        tournamentService.getActiveTemplates()
      ]);
      setClubTournaments(tournamentsResp.data || []);
      setTournamentTemplates(templatesResp.data || []);
    } catch (error) {
      console.error('Error loading club tournaments:', error);
      alert('Error loading tournament data');
    }
  };

  const handleCreateClubTournament = async (e) => {
    e.preventDefault();
    if (!tournamentForm.templateId || !tournamentForm.name) {
      alert('Please select a template and provide a tournament name');
      return;
    }
    try {
      await tournamentService.createClubTournamentFromTemplate(
        selectedClub.clubId,
        {
          templateId: parseInt(tournamentForm.templateId),
          name: tournamentForm.name,
          startDate: tournamentForm.startDate || null,
          endDate: tournamentForm.endDate || null
        },
        user.userId
      );
      alert('Club tournament created! Players have been auto-joined with PENDING status.');
      setShowCreateTournamentForm(false);
      setTournamentForm({ templateId: '', name: '', startDate: '', endDate: '' });
      // Reload tournaments
      const tournamentsResp = await tournamentService.getClubTournaments(selectedClub.clubId);
      setClubTournaments(tournamentsResp.data || []);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to create tournament'));
    }
  };

  const handleApproveTournament = async (tournamentId) => {
    if (!window.confirm('Approve this tournament? It will move to APPROVED status.')) return;
    try {
      await tournamentService.approveClubTournament(selectedClub.clubId, tournamentId, user.userId);
      alert('Tournament approved!');
      const tournamentsResp = await tournamentService.getClubTournaments(selectedClub.clubId);
      setClubTournaments(tournamentsResp.data || []);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to approve'));
    }
  };

  const handleRejectTournament = async (tournamentId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await tournamentService.rejectClubTournament(selectedClub.clubId, tournamentId, reason, user.userId);
      alert('Tournament rejected');
      const tournamentsResp = await tournamentService.getClubTournaments(selectedClub.clubId);
      setClubTournaments(tournamentsResp.data || []);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to reject'));
    }
  };

  const handleStartTournament = async (tournamentId) => {
    if (!window.confirm('Start this tournament? It will change to PUBLISHED status.')) return;
    try {
      await tournamentService.startClubTournament(selectedClub.clubId, tournamentId, user.userId);
      alert('Tournament started and published!');
      const tournamentsResp = await tournamentService.getClubTournaments(selectedClub.clubId);
      setClubTournaments(tournamentsResp.data || []);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to start'));
    }
  };

  if (loading || !user) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Pagination helper
  const getPaginatedItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const paginatedClubs = getPaginatedItems(filteredClubs, clubsPage);
  const paginatedTokens = getPaginatedItems(tokens, tokensPage);
  const paginatedRequests = getPaginatedItems(joinRequests, requestsPage);

  return (
    <div className="club-management">
      <nav className="management-navbar">
        <div className="navbar-brand">
          <h2>🏢 Club Management</h2>
          <span className="admin-badge">{user.role === 'SUPER_USER' ? 'Super User' : user.role === 'SYSTEM_ADMIN' ? 'System Admin' : user.role === 'CLUB_ADMIN' ? 'Club Admin' : 'Rating Admin'}</span>
        </div>
        <div className="navbar-actions">
          <span className="admin-username">{user.username}</span>
          <HamburgerMenu user={user} onSignOut={() => { authService.logout(); navigate('/login'); }} isAdmin={true} />
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
            className={`tab`}
            onClick={() => navigate('/admin')}
          >
            Player Verification
          </button>
        </div>

        {/* Only show clubs tab content now */}
        {activeTab === 'clubs' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Clubs & Venues</h2>
              <div className="header-actions">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search clubs by name, address, city..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => handleSearch('')} 
                      className="clear-search-btn"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button onClick={() => setShowCreateClubForm(!showCreateClubForm)} className="primary-btn">
                  {showCreateClubForm ? 'Cancel' : '+ Create Club'}
                </button>
              </div>
            </div>
            
            {searchQuery && (
              <div className="search-results-info">
                Found {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}

            {(showCreateClubForm || editingClub) && (
              <div className="form-card">
                <h3>{editingClub ? 'Edit Club' : 'Create New Club'}</h3>
                <form onSubmit={editingClub ? handleUpdateClub : handleCreateClub}>
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
                      <label>City</label>
                      <input
                        type="text"
                        value={clubForm.city}
                        onChange={(e) => setClubForm({...clubForm, city: e.target.value})}
                        placeholder="e.g., Johannesburg"
                      />
                    </div>
                    <div className="form-group">
                      <label>Suburb</label>
                      <input
                        type="text"
                        value={clubForm.suburb}
                        onChange={(e) => setClubForm({...clubForm, suburb: e.target.value})}
                        placeholder="e.g., Sandton"
                      />
                    </div>
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
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      {editingClub ? 'Update Club' : 'Create Club'}
                    </button>
                    {editingClub && (
                      <button type="button" onClick={handleCancelEdit} className="cancel-btn">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="clubs-grid">
              {paginatedClubs.length === 0 ? (
                <div className="no-results">
                  {searchQuery ? (
                    <p>No clubs found matching your search criteria.</p>
                  ) : (
                    <p>No clubs available.</p>
                  )}
                </div>
              ) : (
                paginatedClubs.map(club => (
                  <div key={club.clubId} className="club-card" onClick={() => handleClubClick(club)}>
                    <div className="club-header">
                      <h3>{club.name}</h3>
                      <span className={`status-badge ${club.status.toLowerCase()}`}>
                        {club.status}
                      </span>
                    </div>
                    <div className="club-details">
                      {club.description && <p>{club.description}</p>}
                      {club.address && <p><strong>📍</strong> {club.address}</p>}
                      {(club.city || club.suburb) && (
                        <p><strong>🏘️</strong> {[club.suburb, club.city].filter(Boolean).join(', ')}</p>
                      )}
                      {club.contactEmail && <p><strong>📧</strong> {club.contactEmail}</p>}
                      {club.contactPhone && <p><strong>📞</strong> {club.contactPhone}</p>}
                      <p className="club-meta">Created by {club.createdByUsername}</p>
                    </div>
                    <div className="club-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleClubClick(club)}
                        className="action-btn primary"
                        title="View Club Dashboard"
                      >
                        🏢 Open Dashboard
                      </button>
                    </div>
                </div>
                ))
              )}
            </div>
            <Pagination
              currentPage={clubsPage}
              totalItems={filteredClubs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setClubsPage}
            />
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Admin Registration Tokens</h2>
              {(user.role === 'SUPER_USER' || user.role === 'SYSTEM_ADMIN') && (
                <button onClick={() => setShowTokenForm(!showTokenForm)} className="primary-btn">
                  {showTokenForm ? 'Cancel' : '+ Generate Token'}
                </button>
              )}
            </div>

            {showTokenForm && (user.role === 'SUPER_USER' || user.role === 'SYSTEM_ADMIN') && (
              <div className="form-card">
                <h3>Generate Admin Token</h3>
                <form onSubmit={handleGenerateToken}>
                  <div className="form-group">
                    <label>Admin Role *</label>
                    <select
                      value={tokenForm.role}
                      onChange={(e) => {
                        setTokenForm({...tokenForm, role: e.target.value});
                      }}
                      required
                    >
                      {user.role === 'SUPER_USER' && (
                        <option value="SYSTEM_ADMIN">System Admin</option>
                      )}
                      {user.role === 'SYSTEM_ADMIN' && (
                        <>
                          <option value="CLUB_ADMIN">Club Admin</option>
                          <option value="RATING_ADMIN">Rating Admin</option>
                        </>
                      )}
                    </select>
                    <small style={{color: '#666', marginTop: '4px', display: 'block'}}>
                      {user.role === 'SUPER_USER' ? 'System Admins manage the platform' : 'Admins assigned to clubs during registration'}
                    </small>
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
                  {paginatedTokens.map(token => (
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
            <Pagination
              currentPage={tokensPage}
              totalItems={tokens.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setTokensPage}
            />
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
                    <th>Club Request</th>
                    <th>Message</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map(request => (
                    <tr key={request.requestId}>
                      <td><strong>{request.playerName}</strong></td>
                      <td>
                        {request.isClubChange ? (
                          <div>
                            <div style={{color: '#f39c12', fontWeight: 'bold', marginBottom: '4px'}}>
                              ⚠️ CLUB CHANGE
                            </div>
                            <div style={{fontSize: '0.9em'}}>
                              From: <span style={{color: '#e74c3c'}}>{request.previousClubName}</span>
                            </div>
                            <div style={{fontSize: '0.9em'}}>
                              To: <span style={{color: '#27ae60'}}>{request.clubName}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{color: '#27ae60', fontWeight: 'bold', marginBottom: '4px'}}>
                              ✓ NEW MEMBER
                            </div>
                            <div style={{fontSize: '0.9em'}}>{request.clubName}</div>
                          </div>
                        )}
                      </td>
                      <td>{request.message || '-'}</td>
                      <td>{new Date(request.requestedAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => openReviewModal(request, 'APPROVED')}
                            className="action-btn success"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => openReviewModal(request, 'REJECTED')}
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
            <Pagination
              currentPage={requestsPage}
              totalItems={joinRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setRequestsPage}
            />
          </div>
        )}
      </div>

      {/* Review Request Modal */}
      {showReviewModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <h2>{reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Join Request</h2>
            
            <div style={{marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px'}}>
              <h3 style={{marginBottom: '10px'}}>Request Details</h3>
              <p><strong>Player:</strong> {selectedRequest.playerName}</p>
              <p><strong>Club:</strong> {selectedRequest.clubName}</p>
              {selectedRequest.isClubChange && (
                <p><strong>Previous Club:</strong> {selectedRequest.previousClubName}</p>
              )}
              {selectedRequest.message && (
                <p><strong>Message:</strong> {selectedRequest.message}</p>
              )}
            </div>

            {/* Player History */}
            {playerHistory.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h3 style={{marginBottom: '10px'}}>Player Join Request History</h3>
                <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '10px'}}>
                  {playerHistory.map((history, index) => (
                    <div key={index} style={{
                      padding: '10px',
                      marginBottom: '10px',
                      background: history.status === 'REJECTED' ? '#ffebee' : history.status === 'APPROVED' ? '#e8f5e9' : '#fff3e0',
                      borderRadius: '5px',
                      borderLeft: `4px solid ${history.status === 'REJECTED' ? '#f44336' : history.status === 'APPROVED' ? '#4caf50' : '#ff9800'}`
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                        <strong>{history.clubName}</strong>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.85em',
                          background: history.status === 'REJECTED' ? '#f44336' : history.status === 'APPROVED' ? '#4caf50' : '#ff9800',
                          color: 'white'
                        }}>
                          {history.status}
                        </span>
                      </div>
                      <div style={{fontSize: '0.9em', color: '#666'}}>
                        <div>Requested: {new Date(history.requestedAt).toLocaleDateString()}</div>
                        {history.reviewedAt && (
                          <div>Reviewed: {new Date(history.reviewedAt).toLocaleDateString()}</div>
                        )}
                        {history.reviewNotes && (
                          <div style={{marginTop: '5px', color: '#333'}}>
                            <strong>Notes:</strong> {history.reviewNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {reviewAction === 'REJECTED' && (
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection (mandatory)"
                  rows="4"
                  required
                  style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>
            )}

            {reviewAction === 'APPROVED' && (
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Add any notes about this approval"
                  rows="3"
                  style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd'}}
                />
              </div>
            )}

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRequest(null);
                  setPlayerHistory([]);
                  setRejectionReason('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleReviewRequest}
                className={reviewAction === 'APPROVED' ? 'submit-btn' : 'danger-btn'}
                style={{
                  background: reviewAction === 'APPROVED' ? '#4caf50' : '#f44336',
                  color: 'white'
                }}
              >
                {reviewAction === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Club Tournament Modal */}
      {showTournamentModal && selectedClub && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>🏆 {selectedClub.name} - Tournaments</h2>
              <button 
                onClick={() => {
                  setShowTournamentModal(false);
                  setSelectedClub(null);
                  setShowCreateTournamentForm(false);
                  setTournamentForm({ templateId: '', name: '', startDate: '', endDate: '' });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {/* Create Tournament Form */}
            {!showCreateTournamentForm && (
              <button 
                onClick={() => setShowCreateTournamentForm(true)}
                className="primary-btn"
                style={{marginBottom: '20px'}}
              >
                + Create Club Tournament
              </button>
            )}

            {showCreateTournamentForm && (
              <div className="form-card" style={{marginBottom: '20px'}}>
                <h3>Create Tournament from Template</h3>
                <form onSubmit={handleCreateClubTournament}>
                  <div className="form-group">
                    <label>Tournament Template *</label>
                    <select
                      value={tournamentForm.templateId}
                      onChange={(e) => setTournamentForm({...tournamentForm, templateId: e.target.value})}
                      required
                    >
                      <option value="">Select a template...</option>
                      {tournamentTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.templateName} - {template.tournamentType} ({template.maxPlayers} players max)
                        </option>
                      ))}
                    </select>
                    {tournamentForm.templateId && tournamentTemplates.find(t => t.id === parseInt(tournamentForm.templateId)) && (
                      <small style={{color: '#666', marginTop: '8px', display: 'block'}}>
                        {tournamentTemplates.find(t => t.id === parseInt(tournamentForm.templateId)).description}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Tournament Name *</label>
                    <input
                      type="text"
                      value={tournamentForm.name}
                      onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                      placeholder="e.g., January 2026 Club Championship"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date (Optional)</label>
                      <input
                        type="date"
                        value={tournamentForm.startDate}
                        onChange={(e) => setTournamentForm({...tournamentForm, startDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date (Optional)</label>
                      <input
                        type="date"
                        value={tournamentForm.endDate}
                        onChange={(e) => setTournamentForm({...tournamentForm, endDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '10px'}}>
                    <button type="submit" className="submit-btn">Create Tournament</button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowCreateTournamentForm(false);
                        setTournamentForm({ templateId: '', name: '', startDate: '', endDate: '' });
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                <p style={{marginTop: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '5px', fontSize: '0.9em'}}>
                  <strong>Note:</strong> All club members will be auto-joined with PENDING status. 
                  You must approve players before they can participate.
                </p>
              </div>
            )}

            {/* Tournament List */}
            <div>
              <h3>Club Tournaments</h3>
              {clubTournaments.length === 0 ? (
                <p style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                  No tournaments created yet. Create one using a template!
                </p>
              ) : (
                <div style={{display: 'grid', gap: '15px'}}>
                  {clubTournaments.map(tournament => (
                    <div 
                      key={tournament.id} 
                      style={{
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '15px',
                        background: '#f9f9f9'
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px'}}>
                        <div>
                          <h4 style={{margin: '0 0 8px 0'}}>{tournament.name}</h4>
                          <div style={{fontSize: '0.9em', color: '#666'}}>
                            <div><strong>Type:</strong> {tournament.tournamentType}</div>
                            {tournament.startDate && (
                              <div><strong>Start:</strong> {new Date(tournament.startDate).toLocaleDateString()}</div>
                            )}
                            {tournament.endDate && (
                              <div><strong>End:</strong> {new Date(tournament.endDate).toLocaleDateString()}</div>
                            )}
                            <div><strong>Template:</strong> {tournament.templateName || 'N/A'}</div>
                          </div>
                        </div>
                        <span 
                          style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            fontWeight: '600',
                            background: 
                              tournament.approvalStatus === 'APPROVED' ? '#4caf50' :
                              tournament.approvalStatus === 'REJECTED' ? '#f44336' :
                              tournament.approvalStatus === 'PENDING_APPROVAL' ? '#ff9800' :
                              '#999',
                            color: 'white'
                          }}
                        >
                          {tournament.approvalStatus || tournament.status}
                        </span>
                      </div>

                      {/* Actions based on status */}
                      <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                        {tournament.approvalStatus === 'PENDING_APPROVAL' && (
                          <>
                            <button 
                              onClick={() => handleApproveTournament(tournament.id)}
                              className="action-btn success"
                              style={{fontSize: '0.9em'}}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              onClick={() => handleRejectTournament(tournament.id)}
                              className="action-btn danger"
                              style={{fontSize: '0.9em'}}
                            >
                              × Reject
                            </button>
                          </>
                        )}
                        {tournament.approvalStatus === 'APPROVED' && tournament.status !== 'PUBLISHED' && (
                          <button 
                            onClick={() => handleStartTournament(tournament.id)}
                            className="action-btn primary"
                            style={{fontSize: '0.9em'}}
                          >
                            🚀 Start Tournament
                          </button>
                        )}
                        {tournament.status === 'PUBLISHED' && (
                          <button 
                            onClick={() => navigate(`/tournaments/${tournament.id}`)}
                            className="action-btn info"
                            style={{fontSize: '0.9em'}}
                          >
                            📊 View Tournament
                          </button>
                        )}
                      </div>

                      {/* Player count info */}
                      <div style={{marginTop: '10px', padding: '8px', background: '#fff', borderRadius: '5px', fontSize: '0.85em'}}>
                        <strong>Players:</strong> Auto-joined all club members with PENDING status. 
                        Approve individual players in tournament management.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubManagement;
