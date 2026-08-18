import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HamburgerMenu.css';

const HamburgerMenu = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

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
                {user?.role === 'SYSTEM_ADMIN' ? 'System Admin' : 'Player'}
              </span>
            </div>
          </div>
        </div>

        <nav className="menu-nav">
          <button onClick={() => handleNavigation('/players')} className="menu-item">
            <span className="menu-icon">🏅</span>
            <span>Players</span>
          </button>

          <button onClick={() => handleNavigation('/matches')} className="menu-item">
            <span className="menu-icon">🎮</span>
            <span>Matches</span>
          </button>

          {user?.role === 'SYSTEM_ADMIN' && (
            <button onClick={() => handleNavigation('/rating-settings')} className="menu-item">
              <span className="menu-icon">⚙️</span>
              <span>Rating Settings</span>
            </button>
          )}

          <div className="menu-divider"></div>

          <button onClick={handleSignOut} className="menu-item signout-item">
            <span className="menu-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
