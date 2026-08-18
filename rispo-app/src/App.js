import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RankingsPage from './pages/RankingsPage';
import MatchHistoryPage from './pages/MatchHistoryPage';
import RatingSettingsPage from './pages/RatingSettingsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/players" element={<RankingsPage />} />
        <Route path="/matches" element={<MatchHistoryPage />} />
        <Route path="/rating-settings" element={<RatingSettingsPage />} />
        <Route path="*" element={<Navigate to="/players" replace />} />
      </Routes>
    </Router>
  );
}

export default App;