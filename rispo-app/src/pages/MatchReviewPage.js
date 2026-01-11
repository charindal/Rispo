import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import matchService from '../services/matchService';
import Pagination from '../components/Pagination';
import '../styles/MatchReviewPage.css';

const MatchReviewPage = () => {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'RATING_ADMIN' && currentUser.role !== 'CLUB_ADMIN') {
      navigate('/player-dashboard');
      return;
    }

    setUser(currentUser);
    loadPendingMatches();
  }, [navigate]);

  const loadPendingMatches = async () => {
    try {
      const data = await matchService.getPendingMatches();
      setMatches(data);
    } catch (err) {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (matchId, status) => {
    setProcessing(true);
    setError('');

    try {
      await matchService.reviewMatch(matchId, { status, reviewNotes }, user.userId);
      alert(`Match ${status.toLowerCase()} successfully!`);
      setSelectedMatch(null);
      setReviewNotes('');
      loadPendingMatches();
    } catch (err) {
      setError(err.toString());
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading matches...</div>;

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMatches = matches.slice(startIndex, endIndex);

  return (
    <div className="match-review-page">
      <nav className="review-navbar">
        <h2>Match Review & Rating</h2>
        <button onClick={() => navigate('/admin-dashboard')} className="back-btn">← Back</button>
      </nav>

      <div className="review-container">
        {error && <div className="error-message">{error}</div>}

        <div className="matches-grid">
          <div className="matches-list">
            <h3>Pending Matches ({matches.length})</h3>
            {matches.length === 0 ? (
              <p className="no-matches">No pending matches</p>
            ) : (
              <>
                {paginatedMatches.map(match => (
                  <div
                    key={match.matchId}
                    className={`match-item ${selectedMatch?.matchId === match.matchId ? 'selected' : ''}`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <div className="match-players">
                      <strong>{match.player1.name}</strong> vs <strong>{match.player2.name}</strong>
                    </div>
                    <div className="match-info">
                      <span>{match.games.length} games</span>
                      <span>{new Date(match.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                <Pagination
                  currentPage={currentPage}
                  totalItems={matches.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>

          <div className="match-details">
            {selectedMatch ? (
              <>
                <h3>Match Details</h3>
                <div className="detail-card">
                  <div className="players-section">
                    <div className="player-info">
                      <h4>{selectedMatch.player1.name}</h4>
                      <p>Rating: {selectedMatch.player1.rating}</p>
                    </div>
                    <span className="vs">VS</span>
                    <div className="player-info">
                      <h4>{selectedMatch.player2.name}</h4>
                      <p>Rating: {selectedMatch.player2.rating}</p>
                    </div>
                  </div>

                  <div className="games-list">
                    <h4>Game Results</h4>
                    {selectedMatch.games.map(game => (
                      <div key={game.gameId} className="game-result">
                        <span>Game {game.gameNumber}</span>
                        <span>{game.player1Score} - {game.player2Score}</span>
                        <span className="game-result-type">{game.resultType}</span>
                        {game.winnerName && <span className="winner">Winner: {game.winnerName}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="review-section">
                    <label>Review Notes</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes about this match (optional)"
                      rows="3"
                      disabled={processing || selectedMatch.isRated}
                    />

                    <div className="review-actions">
                      <button
                        onClick={() => handleReview(selectedMatch.matchId, 'APPROVED')}
                        className="approve-btn"
                        disabled={processing || selectedMatch.isRated}
                      >
                        {processing ? 'Processing...' : selectedMatch.isRated ? 'Already Rated' : 'Approve & Rate'}
                      </button>
                      <button
                        onClick={() => handleReview(selectedMatch.matchId, 'REJECTED')}
                        className="reject-btn"
                        disabled={processing || selectedMatch.isRated}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Select a match to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchReviewPage;
