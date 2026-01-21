import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import PlayerDashboard from './pages/PlayerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClubManagement from './pages/ClubManagement';
import ClubDashboard from './pages/ClubDashboard';
import ProfilePage from './pages/ProfilePage';
import RatingSettingsPage from './pages/RatingSettingsPage';
import SubmitMatchPage from './pages/SubmitMatchPage';
import MatchReviewPage from './pages/MatchReviewPage';
import MatchHistoryPage from './pages/MatchHistoryPage';
import ChallengesPage from './pages/ChallengesPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentManagementPage from './pages/TournamentManagementPage';
import TournamentRequestsPage from './pages/TournamentRequestsPage';
import TournamentMatchesPage from './pages/TournamentMatchesPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import TournamentBracketPage from './pages/TournamentBracketPage';
import RankingsPage from './pages/RankingsPage';
import DiagnosticPage from './pages/DiagnosticPage';

// Component to handle hardware back button within Router context
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = () => {
      // If we're on the login page, exit the app
      if (location.pathname === '/login' || location.pathname === '/') {
        CapacitorApp.exitApp();
        return;
      }
      
      // Otherwise, navigate back in history
      navigate(-1);
    };

    // Listen for hardware back button
    const backButtonListener = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      backButtonListener.remove();
    };
  }, [navigate, location]);

  return null; // This component doesn't render anything
}

function App() {
  useEffect(() => {
    // Log environment info on app startup
    console.log('=== RISPO APP STARTUP ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API URL:', process.env.REACT_APP_API_URL);
    console.log('User Agent:', navigator.userAgent);
    console.log('Current URL:', window.location.href);
    const user = localStorage.getItem('user');
    console.log('Stored user:', user ? 'Yes' : 'No');
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('User data:', { ...userData, token: userData.token ? '***EXISTS***' : 'MISSING' });
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    console.log('========================');
  }, []);

  return (
    <Router>
      <BackButtonHandler />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/player-dashboard" element={<PlayerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/club-management" element={<ClubManagement />} />
        <Route path="/clubs/:clubId" element={<ClubDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/rating-settings" element={<RatingSettingsPage />} />
        <Route path="/submit-match" element={<SubmitMatchPage />} />
        <Route path="/review-matches" element={<MatchReviewPage />} />
        <Route path="/match-history" element={<MatchHistoryPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/manage" element={<TournamentManagementPage />} />
        <Route path="/tournament-requests/:tournamentId" element={<TournamentRequestsPage />} />
        <Route path="/tournament-matches/:tournamentId" element={<TournamentMatchesPage />} />
        <Route path="/tournament-standings/:tournamentId" element={<TournamentStandingsPage />} />
        <Route path="/tournament-bracket/:tournamentId" element={<TournamentBracketPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
