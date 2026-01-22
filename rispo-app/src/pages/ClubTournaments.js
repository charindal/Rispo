import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clubService from '../services/clubService';
import authService from '../services/authService';
import PlayerApprovalPage from './PlayerApprovalPage';
import '../styles/ClubTournaments.css';

const ClubTournaments = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [user] = useState(authService.getCurrentUser());
  const [club, setClub] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pointsConfig, setPointsConfig] = useState({
    winner: 5,
    runnerUp: 3,
    semifinalist: 2,
    quarterfinalist: 1
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drawType, setDrawType] = useState('RANDOM');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [showApprovalModal, setShowApprovalModal] = useState(null);

  const isClubAdmin = () => {
    return user && (['SUPER_USER', 'SYSTEM_ADMIN', 'CLUB_ADMIN'].includes(user.role) || 
           (user.role === 'RATING_ADMIN' && user.clubId === parseInt(clubId)));
  };

  useEffect(() => {
    loadClubData();
    loadTournaments();
    loadLeaderboard();
    loadPointsConfig();
  }, [clubId]);

  const loadClubData = async () => {
    try {
      const clubData = await clubService.getClubById(clubId);
      setClub(clubData);
    } catch (error) {
      console.error('Error loading club:', error);
    }
  };

  const loadPointsConfig = async () => {
    try {
      const config = await clubService.getTournamentPointsConfig(clubId);
      setPointsConfig(config);
    } catch (error) {
      console.error('Error loading points config:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      const tournamentsData = await clubService.getClubKnockoutTournaments(clubId);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await clubService.getClubTournamentLeaderboard(clubId);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleCreateTournament = async () => {
    try {
      await clubService.createWeeklyKnockoutTournament(clubId, user.userId, drawType);
      setShowCreateModal(false);
      setDrawType('RANDOM'); // Reset to default
      loadTournaments();
      alert('Weekly knockout tournament created successfully!');
    } catch (error) {
      alert('Error creating tournament: ' + error.message);
    }
  };

  const handleUpdatePointsConfig = async () => {
    try {
      await clubService.updateTournamentPointsConfig(clubId, pointsConfig, user.userId);
      alert('Points configuration updated successfully!');
    } catch (error) {
      alert('Error updating points config: ' + error.message);
    }
  };

  const handleStartTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to start this tournament? This will generate the matches and begin the tournament.')) {
      return;
    }
    
    try {
      await clubService.startKnockoutTournament(clubId, tournamentId, user.userId);
      loadTournaments();
      alert('Tournament started successfully! Matches have been generated.');
    } catch (error) {
      alert('Error starting tournament: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading club tournaments...</div>;
  }

  return (
    <div className="club-tournaments">
      <div className="tournaments-header">
        <div className="header-content">
          <button onClick={() => navigate(`/clubs/${clubId}`)} className="back-btn">
            ← Back to Club Dashboard
          </button>
          <h1>{club?.name} - Knockout Tournaments</h1>
          <p>Weekly knockout competitions with annual championship</p>
        </div>
        {isClubAdmin() && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="create-tournament-btn"
          >
            🏆 Create Weekly Tournament
          </button>
        )}
      </div>

      <div className="tournaments-tabs">
        <button 
          className={`tab ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Current Tournaments
        </button>
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Annual Leaderboard
        </button>
        {isClubAdmin() && (
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'current' && (
          <div className="current-tournaments">
            <h3>Active & Recent Tournaments</h3>
            {tournaments.length === 0 ? (
              <div className="no-tournaments">
                <p>No tournaments have been created yet.</p>
                {isClubAdmin() && (
                  <p>Create your first weekly knockout tournament to get started!</p>
                )}
              </div>
            ) : (
              <div className="tournaments-grid">
                {tournaments.map(tournament => (
                  <div key={tournament.id} className="tournament-card">
                    <div className="tournament-header">
                      <h4>{tournament.name}</h4>
                      <span className={`status ${tournament.status.toLowerCase()}`}>
                        {tournament.status}
                      </span>
                    </div>
                    <div className="tournament-info">
                      <p>Week: {tournament.weekNumber}</p>
                      <p>Participants: {tournament.participantCount}</p>
                      <p>Round: {tournament.currentRound}</p>
                      {tournament.winner && (
                        <p className="winner">Winner: {tournament.winner}</p>
                      )}
                    </div>
                    <div className="tournament-actions">
                      <button 
                        onClick={() => navigate(`/club/${clubId}/tournament-bracket/${tournament.id}`)}
                        className="view-bracket-btn"
                      >
                        View Bracket
                      </button>
                      {isClubAdmin() && tournament.status === 'APPROVED' && (
                        <button 
                          onClick={() => setShowApprovalModal(tournament)}
                          className="approval-btn"
                        >
                          👥 Player Approval
                        </button>
                      )}
                      {isClubAdmin() && tournament.status === 'UPCOMING' && (
                        <button 
                          onClick={() => handleStartTournament(tournament.id)}
                          className="start-tournament-btn"
                        >
                          🚀 Start Tournament
                        </button>
                      )}
                      {isClubAdmin() && tournament.status === 'IN_PROGRESS' && (
                        <button 
                          onClick={() => navigate(`/club/${clubId}/tournament-bracket/${tournament.id}`)}
                          className="manage-btn"
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="annual-leaderboard">
            <h3>Annual Championship Leaderboard</h3>
            <div className="leaderboard-info">
              <p>Points are awarded based on tournament performance:</p>
              <div className="points-legend">
                <span className="point-item">🥇 Winner: {pointsConfig.winner} points</span>
                <span className="point-item">🥈 Runner-up: {pointsConfig.runnerUp} points</span>
                <span className="point-item">🥉 Semi-finalist: {pointsConfig.semifinalist} points</span>
                <span className="point-item">🏅 Quarter-finalist: {pointsConfig.quarterfinalist} points</span>
              </div>
            </div>
            
            <div className="leaderboard-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Total Points</th>
                    <th>Tournaments</th>
                    <th>Best Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, index) => (
                    <tr key={player.playerId} className={index < 3 ? 'top-three' : ''}>
                      <td className="rank">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && (index + 1)}
                      </td>
                      <td className="player-name">{player.playerName}</td>
                      <td className="points">{player.totalPoints}</td>
                      <td>{player.tournamentsPlayed}</td>
                      <td>{player.bestFinish}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isClubAdmin() && (
          <div className="tournament-settings">
            <h3>Tournament Configuration</h3>
            
            <div className="points-config">
              <h4>Points Configuration</h4>
              <div className="config-grid">
                <div className="config-item">
                  <label>Winner Points:</label>
                  <input
                    type="number"
                    value={pointsConfig.winner}
                    onChange={(e) => setPointsConfig({...pointsConfig, winner: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="config-item">
                  <label>Runner-up Points:</label>
                  <input
                    type="number"
                    value={pointsConfig.runnerUp}
                    onChange={(e) => setPointsConfig({...pointsConfig, runnerUp: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="config-item">
                  <label>Semi-finalist Points:</label>
                  <input
                    type="number"
                    value={pointsConfig.semifinalist}
                    onChange={(e) => setPointsConfig({...pointsConfig, semifinalist: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="config-item">
                  <label>Quarter-finalist Points:</label>
                  <input
                    type="number"
                    value={pointsConfig.quarterfinalist}
                    onChange={(e) => setPointsConfig({...pointsConfig, quarterfinalist: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <button onClick={handleUpdatePointsConfig} className="save-config-btn">
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>

      {showApprovalModal && (
        <div className="modal-overlay">
          <PlayerApprovalPage 
            clubId={clubId} 
            tournamentId={showApprovalModal.id}
            tournamentName={showApprovalModal.name}
            onClose={() => {
              setShowApprovalModal(null);
              loadTournaments();
            }}
          />
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-tournament-modal">
            <h3>Create Weekly Knockout Tournament</h3>
            <p>This will create a new knockout tournament for all club members.</p>
            
            <div className="tournament-options">
              <div className="option-group">
                <label><strong>Draw Type:</strong></label>
                <div className="draw-type-options">
                  <label className="draw-option">
                    <input 
                      type="radio" 
                      value="RANDOM" 
                      checked={drawType === 'RANDOM'} 
                      onChange={(e) => setDrawType(e.target.value)}
                    />
                    <span>Random Draw</span>
                    <small>Players are randomly assigned to bracket positions</small>
                  </label>
                  <label className="draw-option">
                    <input 
                      type="radio" 
                      value="SEEDED" 
                      checked={drawType === 'SEEDED'} 
                      onChange={(e) => setDrawType(e.target.value)}
                    />
                    <span>Seeded Draw</span>
                    <small>Players seeded by rating - higher rated players get byes if needed</small>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="tournament-details">
              <div className="detail-item">
                <strong>Format:</strong> Single-elimination knockout
              </div>
              <div className="detail-item">
                <strong>Participants:</strong> All active club members
              </div>
              <div className="detail-item">
                <strong>Seeding:</strong> {drawType === 'SEEDED' ? 'Seeded by rating (highest rated players get byes)' : 'Random draw'}
              </div>
              <div className="detail-item">
                <strong>Points:</strong> Winner ({pointsConfig.winner}), Runner-up ({pointsConfig.runnerUp}), 
                Semi-finalists ({pointsConfig.semifinalist}), Quarter-finalists ({pointsConfig.quarterfinalist})
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleCreateTournament} className="confirm-btn">
                Create Tournament
              </button>
              <button onClick={() => setShowCreateModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubTournaments;