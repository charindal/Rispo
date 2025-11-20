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
      </Routes>
    </Router>
  );
}

export default App;
