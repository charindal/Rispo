import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import HamburgerMenu from '../components/HamburgerMenu';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    verifiedPlayers: 0,
    pendingVerification: 0,
    totalMatches: 0
  });
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'RATING_ADMIN' && currentUser.role !== 'CLUB_ADMIN') {
      navigate('/player-dashboard');
      return;
    }

    setUser(currentUser);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // Fetch all players
      const response = await fetch('/api/players');
      const players = await response.json();

      // Calculate stats
      const verified = players.filter(p => p.isVerified).length;
      const pending = players.filter(p => !p.isVerified).length;

      setStats({
        totalPlayers: players.length,
        verifiedPlayers: verified,
        pendingVerification: pending,
        totalMatches: 0 // TODO: Implement when match endpoint is ready
      });

      // Get recent players (last 5)
      setRecentPlayers(players.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.logout();
    navigate('/login');
  };

  const navigateToVerification = () => {
    navigate('/admin');
  };

  if (loading || !user) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Admin Navbar */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src="/logo.jpeg" alt="Rispo Logo" className="navbar-logo" />
          <h2>🎯 Rispo Admin</h2>
          <span className="admin-badge">
            {user.role === 'SUPER_USER' ? 'Super User' : 
             user.role === 'SYSTEM_ADMIN' ? 'System Admin' : 
             user.role === 'CLUB_ADMIN' ? 'Club Admin' : 
             user.role === 'RATING_ADMIN' ? 'Rating Admin' : 'Admin'}
          </span>
        </div>
        <div className="navbar-actions">
          <span className="admin-username">{user.username}</span>
          <HamburgerMenu user={user} onSignOut={handleSignOut} isAdmin={true} />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Administration Dashboard</h1>
          <p>System overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card primary">
            <div className="stat-icon">👥</div>
            <div className="stat-details">
              <h3>Total Players</h3>
              <p className="stat-number">{stats.totalPlayers}</p>
            </div>
          </div>

          <div className="admin-stat-card success">
            <div className="stat-icon">✓</div>
            <div className="stat-details">
              <h3>Verified Players</h3>
              <p className="stat-number">{stats.verifiedPlayers}</p>
            </div>
          </div>

          <div className="admin-stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-details">
              <h3>Pending Verification</h3>
              <p className="stat-number">{stats.pendingVerification}</p>
            </div>
          </div>

          <div className="admin-stat-card info">
            <div className="stat-icon">🎮</div>
            <div className="stat-details">
              <h3>Total Matches</h3>
              <p className="stat-number">{stats.totalMatches}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card" onClick={() => navigate('/review-matches')}>
              <div className="action-icon">⚖️</div>
              <h3>Review Matches</h3>
              <p>Approve/reject match results and process ratings</p>
            </button>

            <button className="action-card" onClick={navigateToVerification}>
              <div className="action-icon">✓</div>
              <h3>Player Verification</h3>
              <p>Review and verify player accounts</p>
            </button>

            {(user.role === 'SUPER_USER' || user.role === 'SYSTEM_ADMIN' || user.role === 'CLUB_ADMIN' || user.role === 'RATING_ADMIN') && (
              <button className="action-card" onClick={() => navigate('/club-management')}>
                <div className="action-icon">🏢</div>
                <h3>Club Management</h3>
                <p>Manage clubs, tokens & join requests</p>
              </button>
            )}

            {(user.role === 'SUPER_USER' || user.role === 'SYSTEM_ADMIN' || user.role === 'RATING_ADMIN') && (
              <button className="action-card" onClick={() => navigate('/rating-settings')}>
                <div className="action-icon">⚙️</div>
                <h3>Rating Settings</h3>
                <p>Configure K-factors and rating parameters</p>
              </button>
            )}

            <button className="action-card" onClick={() => navigate('/tournaments/manage')}>
              <div className="action-icon">🏆</div>
              <h3>Manage Tournaments</h3>
              <p>Create and manage tournaments</p>
            </button>

            <button className="action-card" onClick={() => alert('Coming soon')}>
              <div className="action-icon">📊</div>
              <h3>View Reports</h3>
              <p>Generate system reports</p>
            </button>
          </div>
        </div>

        {/* Recent Players */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Registrations</h2>
            <button onClick={navigateToVerification} className="view-all-btn">
              View All →
            </button>
          </div>
          
          <div className="recent-table">
            <table>
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Email</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentPlayers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                      No players registered yet
                    </td>
                  </tr>
                ) : (
                  recentPlayers.map(player => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{player.email || 'N/A'}</td>
                      <td>
                        <span className="rating-badge">{player.rating}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${player.isVerified ? 'verified' : 'pending'}`}>
                          {player.isVerified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>{new Date(player.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
