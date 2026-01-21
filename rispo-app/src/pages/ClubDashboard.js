import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService';
import clubService from '../services/clubService';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/ClubDashboard.css';

const ClubDashboard = () => {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [hasAccess, setHasAccess] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    suburb: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadClubData(currentUser);
  }, [navigate, clubId]);

  const loadClubData = async (currentUser) => {
    try {
      // Load club basic information first
      const clubData = await clubService.getClubById(clubId);
      setClub(clubData);
      setClubForm({
        name: clubData.name || '',
        description: clubData.description || '',
        address: clubData.address || '',
        city: clubData.city || '',
        suburb: clubData.suburb || '',
        contactEmail: clubData.contactEmail || '',
        contactPhone: clubData.contactPhone || ''
      });

      // Check user access - admin roles or club members have access
      const isAdmin = ['SUPER_USER', 'SYSTEM_ADMIN', 'CLUB_ADMIN', 'RATING_ADMIN'].includes(currentUser.role);
      
      // For now, let members access if they have any role (we'll refine this with proper membership check later)
      const hasAnyAccess = isAdmin || currentUser.role === 'PLAYER';
      
      if (!hasAnyAccess) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      setHasAccess(true);

      // Load additional data
      const promises = [
        clubService.getClubMembers(clubId),
        clubService.getClubTournaments(clubId)
      ];
      
      // Load join requests if user is admin
      if (isAdmin) {
        promises.push(clubService.getClubJoinRequests(clubId, 'PENDING'));
      }

      const results = await Promise.all(promises);
      setMembers(results[0] || []);
      setTournaments(results[1] || []);
      if (results[2]) {
        setJoinRequests(results[2]);
      }
      
    } catch (error) {
      console.error('Error loading club data:', error);
      if (error.message.includes('404') || error.message.includes('not found')) {
        navigate('/club-management');
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return user && ['SUPER_USER', 'SYSTEM_ADMIN', 'CLUB_ADMIN', 'RATING_ADMIN'].includes(user.role);
  };

  const isClubAdmin = () => {
    return user && club && (
      isAdmin() || 
      club.createdBy === user.userId ||
      members.some(member => member.userId === user.userId && member.isAdmin)
    );
  };

  const handleBackToClubManagement = () => {
    if (isAdmin()) {
      navigate('/club-management');
    } else {
      navigate('/player-dashboard');
    }
  };

  const handleEditClub = async (e) => {
    e.preventDefault();
    try {
      await clubService.updateClub(clubId, clubForm, user.userId);
      setClub({ ...club, ...clubForm });
      setShowEditForm(false);
      alert('Club updated successfully!');
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to update club'));
    }
  };

  const handleUpdateClubStatus = async (status) => {
    const confirmMessage = `Are you sure you want to ${status.toLowerCase()} this club?`;
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await clubService.updateClubStatus(clubId, status, user.userId);
      setClub({ ...club, status });
      alert(`Club ${status.toLowerCase()}d successfully!`);
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to update status'));
    }
  };

  const handleReviewJoinRequest = async () => {
    if (reviewAction === 'REJECTED' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await clubService.reviewClubJoinRequest(
        selectedRequest.requestId,
        reviewAction,
        rejectionReason,
        user.userId
      );
      
      // Refresh join requests
      const updatedRequests = await clubService.getClubJoinRequests(clubId, 'PENDING');
      setJoinRequests(updatedRequests);
      
      // Close modal
      setShowJoinRequestModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      
      alert(`Join request ${reviewAction.toLowerCase()} successfully!`);
    } catch (error) {
      alert('Error: ' + (typeof error === 'string' ? error : error.message || 'Failed to review request'));
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading club dashboard...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="club-dashboard">
        <div className="access-denied">
          <div className="access-denied-content">
            <h2>🚫 Access Denied</h2>
            <p>You don't have permission to view this club dashboard.</p>
            <p>Only club members and administrators can access club dashboards.</p>
            <button onClick={handleBackToClubManagement} className="back-btn">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="club-dashboard">
        <div className="club-not-found">
          <h2>Club Not Found</h2>
          <p>The requested club could not be found.</p>
          <button onClick={handleBackToClubManagement} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="club-dashboard">
      <nav className="club-navbar">
        <div className="navbar-brand">
          <button onClick={handleBackToClubManagement} className="back-btn">
            ← Back
          </button>
          <div className="club-info">
            <h2>{club.name}</h2>
            <span className={`status-badge ${club.status?.toLowerCase()}`}>
              {club.status}
            </span>
          </div>
        </div>
        <div className="navbar-actions">
          <span className="user-info">
            {user.username} 
            {isClubAdmin() ? ' (Admin)' : ' (Member)'}
          </span>
          <HamburgerMenu 
            user={user} 
            onSignOut={() => { 
              authService.logout(); 
              navigate('/login'); 
            }} 
            isAdmin={isAdmin()} 
          />
        </div>
      </nav>

      <div className="club-content">
        <div className="club-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Overview
          </button>
          <button 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 Members ({members.length})
          </button>
          <button 
            className={`tab ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            🏆 Tournaments ({tournaments.length})
          </button>
          {isClubAdmin() && (
            <>
              <button 
                className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                📎 Join Requests ({joinRequests.length})
              </button>
              <button 
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Management
              </button>
            </>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="club-overview-header">
                <h3>Club Overview</h3>
                <div className="club-stats">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <div className="stat-value">{members.length}</div>
                      <div className="stat-label">Members</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-info">
                      <div className="stat-value">{tournaments.length}</div>
                      <div className="stat-label">Tournaments</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                      <div className="stat-value">
                        {members.length > 0 
                          ? Math.round(members.reduce((sum, m) => sum + (m.rating || 1200), 0) / members.length)
                          : 'N/A'
                        }
                      </div>
                      <div className="stat-label">Avg Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="club-details-section">
                <div className="details-card">
                  <h4>Club Information</h4>
                  {club.description && (
                    <div className="detail-item">
                      <strong>Description:</strong> {club.description}
                    </div>
                  )}
                  {club.address && (
                    <div className="detail-item">
                      <strong>📍 Address:</strong> {club.address}
                    </div>
                  )}
                  {(club.city || club.suburb) && (
                    <div className="detail-item">
                      <strong>🏘️ Location:</strong> {[club.suburb, club.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {club.contactEmail && (
                    <div className="detail-item">
                      <strong>📧 Email:</strong> {club.contactEmail}
                    </div>
                  )}
                  {club.contactPhone && (
                    <div className="detail-item">
                      <strong>📞 Phone:</strong> {club.contactPhone}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>👤 Created by:</strong> {club.createdByUsername}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity-section">
                <h4>Recent Activity</h4>
                <div className="activity-list">
                  {tournaments.slice(0, 3).map(tournament => (
                    <div key={tournament.id} className="activity-item">
                      <div className="activity-icon">🏆</div>
                      <div className="activity-content">
                        <div className="activity-title">Tournament: {tournament.name}</div>
                        <div className="activity-date">
                          {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Date TBD'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tournaments.length === 0 && (
                    <div className="no-activity">
                      <p>No recent tournament activity.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-content">
              <div className="section-header">
                <h3>Club Members</h3>
                {isClubAdmin() && (
                  <button className="primary-btn">+ Invite Members</button>
                )}
              </div>
              
              <div className="members-grid">
                {members.map(member => (
                  <div key={member.userId} className="member-card">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <h4>{member.username}</h4>
                        <div className="member-rating">Rating: {member.rating || 'Unrated'}</div>
                        {member.isAdmin && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </div>
                    </div>
                    <div className="member-stats">
                      <div className="stat">
                        <span className="stat-label">Wins</span>
                        <span className="stat-value">{member.wins || 0}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Losses</span>
                        <span className="stat-value">{member.losses || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {members.length === 0 && (
                <div className="no-members">
                  <p>No members found in this club.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="tournaments-content">
              <div className="section-header">
                <h3>Club Tournaments</h3>
                {isClubAdmin() && (
                  <button className="primary-btn">+ Create Tournament</button>
                )}
              </div>
              
              <div className="tournaments-grid">
                {tournaments.map(tournament => (
                  <div key={tournament.id} className="tournament-card">
                    <div className="tournament-header">
                      <h4>{tournament.name}</h4>
                      <span className={`tournament-status ${tournament.status?.toLowerCase()}`}>
                        {tournament.status}
                      </span>
                    </div>
                    <div className="tournament-details">
                      {tournament.description && (
                        <p>{tournament.description}</p>
                      )}
                      <div className="tournament-dates">
                        {tournament.startDate && (
                          <div>
                            <strong>Start:</strong> {new Date(tournament.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {tournament.endDate && (
                          <div>
                            <strong>End:</strong> {new Date(tournament.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="tournament-info">
                        <span>Players: {tournament.playerCount || 0}</span>
                        <span>Format: {tournament.format || 'TBD'}</span>
                      </div>
                    </div>
                    <div className="tournament-actions">
                      <button className="view-btn">View Details</button>
                      {isClubAdmin() && (
                        <button className="manage-btn">Manage</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {tournaments.length === 0 && (
                <div className="no-tournaments">
                  <p>No tournaments have been created yet.</p>
                  {isClubAdmin() && (
                    <p>Create your first tournament to get started!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && isClubAdmin() && (
            <div className="tab-content">
              <div className="section-header">
                <h3>📎 Join Requests</h3>
                <p>Manage membership requests for your club</p>
              </div>
              
              {joinRequests.length === 0 ? (
                <div className="no-data">
                  🎆 No pending join requests
                </div>
              ) : (
                <div className="requests-list">
                  {joinRequests.map((request) => (
                    <div key={request.requestId} className="request-card">
                      <div className="request-info">
                        <h4>{request.playerName}</h4>
                        <p>Email: {request.playerEmail}</p>
                        <p>Rating: {request.currentRating || 'Unrated'}</p>
                        <p>Requested: {new Date(request.requestDate).toLocaleDateString()}</p>
                        {request.message && <p>Message: "{request.message}"</p>}
                      </div>
                      <div className="request-actions">
                        <button 
                          className="btn-approve"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewAction('APPROVED');
                            setShowJoinRequestModal(true);
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="btn-reject"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewAction('REJECTED');
                            setShowJoinRequestModal(true);
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && isClubAdmin() && (
            <div className="tab-content">
              <div className="section-header">
                <h3>⚙️ Club Management</h3>
                <p>Manage club details and status</p>
              </div>

              {!showEditForm ? (
                <div className="management-cards">
                  <div className="management-card">
                    <h4>📝 Edit Club Details</h4>
                    <p>Update club information, contact details, and description</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowEditForm(true)}
                    >
                      Edit Details
                    </button>
                  </div>
                  
                  <div className="management-card">
                    <h4>⚠️ Club Status</h4>
                    <p>Current Status: <span className={`status ${club?.status?.toLowerCase()}`}>{club?.status || 'ACTIVE'}</span></p>
                    <div className="status-buttons">
                      {club?.status !== 'SUSPENDED' && (
                        <button 
                          className="btn-warning"
                          onClick={() => handleUpdateClubStatus('SUSPENDED')}
                        >
                          Suspend Club
                        </button>
                      )}
                      {club?.status === 'SUSPENDED' && (
                        <button 
                          className="btn-success"
                          onClick={() => handleUpdateClubStatus('ACTIVE')}
                        >
                          Reactivate Club
                        </button>
                      )}
                      {club?.status !== 'DEACTIVATED' && (
                        <button 
                          className="btn-danger"
                          onClick={() => handleUpdateClubStatus('DEACTIVATED')}
                        >
                          Deactivate Club
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="edit-form">
                  <form onSubmit={handleEditClub}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Club Name *</label>
                        <input
                          type="text"
                          value={clubForm.name}
                          onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Contact Email *</label>
                        <input
                          type="email"
                          value={clubForm.contactEmail}
                          onChange={(e) => setClubForm({ ...clubForm, contactEmail: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          value={clubForm.contactPhone}
                          onChange={(e) => setClubForm({ ...clubForm, contactPhone: e.target.value })}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          value={clubForm.city}
                          onChange={(e) => setClubForm({ ...clubForm, city: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Suburb</label>
                        <input
                          type="text"
                          value={clubForm.suburb}
                          onChange={(e) => setClubForm({ ...clubForm, suburb: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Address</label>
                      <input
                        type="text"
                        value={clubForm.address}
                        onChange={(e) => setClubForm({ ...clubForm, address: e.target.value })}
                      />
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={clubForm.description}
                        onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        Update Club
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setShowEditForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showJoinRequestModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Review Join Request</h3>
            <div className="request-details">
              <p><strong>Player:</strong> {selectedRequest.playerName}</p>
              <p><strong>Email:</strong> {selectedRequest.playerEmail}</p>
              <p><strong>Rating:</strong> {selectedRequest.currentRating || 'Unrated'}</p>
              {selectedRequest.message && (
                <p><strong>Message:</strong> "{selectedRequest.message}"</p>
              )}
            </div>
            
            {reviewAction === 'REJECTED' && (
              <div className="form-group">
                <label>Reason for rejection:</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  required
                />
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className={reviewAction === 'APPROVED' ? 'btn-approve' : 'btn-reject'}
                onClick={handleReviewJoinRequest}
              >
                {reviewAction === 'APPROVED' ? '✓ Confirm Approval' : '✗ Confirm Rejection'}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowJoinRequestModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;