import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HamburgerMenu.css';

const HamburgerMenu = ({ user, onSignOut, isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  const handleSignOut = () => {
    onSignOut();
    closeMenu();
  };

  return (
    <>
      {/* Hamburger Icon */}
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`} 
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

      {/* Slide-out Menu */}
      <div className={`hamburger-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <div className="menu-user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h3>{user?.username}</h3>
              <span className="user-role">
                {user?.role === 'SUPER_USER' ? 'Super User' :
                 user?.role === 'SYSTEM_ADMIN' ? 'Admin' :
                 user?.role === 'RATING_ADMIN' ? 'Rating Admin' :
                 user?.role === 'CLUB_ADMIN' ? 'Club Admin' : 'Player'}
              </span>
            </div>
          </div>
        </div>

        <nav className="menu-nav">
          <button 
            onClick={() => handleNavigation('/profile')} 
            className="menu-item"
          >
            <span className="menu-icon">👤</span>
            <span>My Profile</span>
          </button>

          {isAdmin ? (
            <>
              {/* Admin Menu Items */}
              <button 
                onClick={() => handleNavigation('/review-matches')} 
                className="menu-item"
              >
                <span className="menu-icon">⚖️</span>
                <span>Review Matches</span>
              </button>

              <button 
                onClick={() => handleNavigation('/admin')} 
                className="menu-item"
              >
                <span className="menu-icon">✓</span>
                <span>Player Verification</span>
              </button>

              {(user?.role === 'SUPER_USER' || user?.role === 'SYSTEM_ADMIN' || 
                user?.role === 'CLUB_ADMIN' || user?.role === 'RATING_ADMIN') && (
                <>
                  <button 
                    onClick={() => handleNavigation('/club-management')} 
                    className="menu-item"
                  >
                    <span className="menu-icon">🏢</span>
                    <span>Club Management</span>
                  </button>

                  <button 
                    onClick={() => handleNavigation('/rating-settings')} 
                    className="menu-item"
                  >
                    <span className="menu-icon">⚙️</span>
                    <span>Rating Settings</span>
                  </button>
                </>
              )}

              <button 
                onClick={() => handleNavigation('/tournaments/manage')} 
                className="menu-item"
              >
                <span className="menu-icon">🏆</span>
                <span>Manage Tournaments</span>
              </button>

              {user?.playerId && (
                <button 
                  onClick={() => handleNavigation('/player-dashboard')} 
                  className="menu-item admin-item"
                >
                  <span className="menu-icon">🎱</span>
                  <span>Player Mode</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Player Menu Items */}
              <button 
                onClick={() => handleNavigation('/rankings')} 
                className="menu-item"
              >
                <span className="menu-icon">📊</span>
                <span>Rankings</span>
              </button>

              <button 
                onClick={() => handleNavigation('/tournaments')} 
                className="menu-item"
              >
                <span className="menu-icon">🏆</span>
                <span>Tournaments</span>
              </button>

              <button 
                onClick={() => handleNavigation('/challenges')} 
                className="menu-item"
              >
                <span className="menu-icon">⚔️</span>
                <span>Challenges</span>
              </button>

              <button 
                onClick={() => handleNavigation('/submit-match')} 
                className="menu-item"
              >
                <span className="menu-icon">📝</span>
                <span>Submit Match</span>
              </button>

              {(user?.role === 'SUPER_USER' || user?.role === 'SYSTEM_ADMIN' || 
                user?.role === 'RATING_ADMIN' || user?.role === 'CLUB_ADMIN') && (
                <button 
                  onClick={() => handleNavigation('/admin-dashboard')} 
                  className="menu-item admin-item"
                >
                  <span className="menu-icon">⚙️</span>
                  <span>Admin Mode</span>
                </button>
              )}
            </>
          )}

          <div className="menu-divider"></div>

          <button 
            onClick={handleSignOut} 
            className="menu-item signout-item"
          >
            <span className="menu-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
