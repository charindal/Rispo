import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import PlayerDashboard from './pages/PlayerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClubManagement from './pages/ClubManagement';
import ProfilePage from './pages/ProfilePage';
import RatingSettingsPage from './pages/RatingSettingsPage';
import SubmitMatchPage from './pages/SubmitMatchPage';
import MatchReviewPage from './pages/MatchReviewPage';
import ChallengesPage from './pages/ChallengesPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentManagementPage from './pages/TournamentManagementPage';
import TournamentRequestsPage from './pages/TournamentRequestsPage';
import TournamentMatchesPage from './pages/TournamentMatchesPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import TournamentBracketPage from './pages/TournamentBracketPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/player-dashboard" element={<PlayerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/club-management" element={<ClubManagement />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/rating-settings" element={<RatingSettingsPage />} />
        <Route path="/submit-match" element={<SubmitMatchPage />} />
        <Route path="/review-matches" element={<MatchReviewPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/manage" element={<TournamentManagementPage />} />
        <Route path="/tournament-requests/:tournamentId" element={<TournamentRequestsPage />} />
        <Route path="/tournament-matches/:tournamentId" element={<TournamentMatchesPage />} />
        <Route path="/tournament-standings/:tournamentId" element={<TournamentStandingsPage />} />
        <Route path="/tournament-bracket/:tournamentId" element={<TournamentBracketPage />} />
      </Routes>
    </Router>
  );
}

export default App;
