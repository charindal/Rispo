import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import matchService from '../services/matchService';
import axios from 'axios';
import '../styles/SubmitMatchPage.css';

const SubmitMatchPage = () => {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [opponentId, setOpponentId] = useState('');
  const [myScore, setMyScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [matchId, setMatchId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.playerId) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Check for matchId from URL params (from challenge)
    const matchIdParam = searchParams.get('matchId');
    if (matchIdParam) {
      setMatchId(matchIdParam);
      loadMatchDetails(matchIdParam, currentUser);
    } else {
      loadPlayers(currentUser.playerId);
    }
  }, [navigate, searchParams]);

  const loadPlayers = async (currentPlayerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/players`);
      const filtered = response.data.filter(p => p.id !== currentPlayerId);
      setPlayers(filtered);
    } catch (err) {
      setError('Failed to load players');
    }
  };

  const loadMatchDetails = async (matchId, currentUser) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`, {
        headers: { 'X-User-Id': currentUser.userId }
      });
      const match = response.data;
      setMatchDetails(match);
      
      // Pre-fill opponent
      const opponentPlayer = match.player1Id === currentUser.playerId ? match.player2Id : match.player1Id;
      setOpponentId(opponentPlayer);
      
      // Store challengeId if exists
      if (match.challengeId) {
        setChallengeId(match.challengeId);
      }
      
      // Still load all players for the dropdown
      await loadPlayers(currentUser.playerId);
    } catch (err) {
      setError('Failed to load match details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!opponentId) {
      setError('Please select an opponent');
      return;
    }

    if (!myScore || !opponentScore) {
      setError('Please enter both scores');
      return;
    }

    setLoading(true);

    try {
      const score1 = parseInt(myScore);
      const score2 = parseInt(opponentScore);
      
      const matchData = {
        opponentPlayerId: parseInt(opponentId),
        challengeId: challengeId ? parseInt(challengeId) : null,
        games: [{
          player1Score: score1,
          player2Score: score2,
          resultType: 'COMPLETED',
          winnerId: score1 > score2 ? user.playerId : (score2 > score1 ? parseInt(opponentId) : null)
        }]
      };

      await matchService.submitMatch(matchData, user.userId);
      alert('Game result submitted successfully! It will be reviewed by an administrator.');
      navigate('/player-dashboard');
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-match-page">
      <nav className="submit-navbar">
        <h2>🎱 Record Game</h2>
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
      </nav>

      <div className="submit-container">
        <div className="submit-card">
          <div className="card-header">
            <h1>🎱 Record Snooker Game</h1>
            <p>Submit your game result for admin review and rating calculation</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>🎯 Select Opponent *</label>
              <select value={opponentId} onChange={(e) => setOpponentId(e.target.value)} required disabled={loading}>
                <option value="">Choose opponent...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Rating: {p.rating})</option>
                ))}
              </select>
            </div>

            <div className="score-section">
              <div className="score-grid">
                <div className="score-input-group">
                  <label>Your Score</label>
                  <div className="score-input-wrapper">
                    <span className="score-icon">🔴</span>
                    <input
                      type="number"
                      value={myScore}
                      onChange={(e) => setMyScore(e.target.value)}
                      min="0"
                      max="147"
                      placeholder="0"
                      required
                      disabled={loading}
                      className="score-input"
                    />
                  </div>
                </div>

                <div className="vs-divider">VS</div>

                <div className="score-input-group">
                  <label>Opponent Score</label>
                  <div className="score-input-wrapper">
                    <span className="score-icon">🟡</span>
                    <input
                      type="number"
                      value={opponentScore}
                      onChange={(e) => setOpponentScore(e.target.value)}
                      min="0"
                      max="147"
                      placeholder="0"
                      required
                      disabled={loading}
                      className="score-input"
                    />
                  </div>
                </div>
              </div>

              {myScore && opponentScore && (
                <div className="result-preview">
                  {parseInt(myScore) > parseInt(opponentScore) && <span className="win-badge">🏆 You Win!</span>}
                  {parseInt(myScore) < parseInt(opponentScore) && <span className="loss-badge">Opponent Wins</span>}
                  {parseInt(myScore) === parseInt(opponentScore) && <span className="draw-badge">🤝 Draw</span>}
                </div>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : '✓ Submit Game Result'}
            </button>
          </form>

          <div className="info-note">
            <small>ℹ️ Game results require admin review before ratings are updated</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitMatchPage;
