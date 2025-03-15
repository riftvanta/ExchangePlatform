import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Handle scrolling to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav 
      className={`navbar ${transparent && !scrolled ? 'navbar-transparent' : 'navbar-solid'} ${scrolled ? 'navbar-scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" aria-label="Home">
            <div className="logo-container">
              <i className="fa-solid fa-exchange-alt logo-icon" aria-hidden="true"></i>
              <span className="logo-text">USDT-JOD Exchange</span>
            </div>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="navbar-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="main-menu"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
          <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
        </button>
        
        {/* Navigation Links - shows on desktop and in mobile menu when open */}
        <div 
          id="main-menu"
          className={`navbar-links ${isMenuOpen ? 'open' : ''}`}
        >
          <div className="nav-items">
            <Link 
              to="/" 
              className={`nav-item ${isActive('/') ? 'active' : ''}`}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              Home
            </Link>
            
            {/* Show only when logged in */}
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                  aria-current={isActive('/dashboard') ? 'page' : undefined}
                >
                  Dashboard
                </Link>
                
                {/* User dropdown menu */}
                <div className="dropdown">
                  <button className={`dropdown-toggle nav-item ${isActive('/profile') || location.pathname.startsWith('/profile/') ? 'active' : ''}`}>
                    Profile <i className="fa-solid fa-chevron-down dropdown-icon" aria-hidden="true"></i>
                    <span className="sr-only">Toggle profile dropdown</span>
                  </button>
                  <div className="dropdown-menu">
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                    >
                      My Profile
                    </Link>
                    <Link 
                      to="/profile/settings" 
                      className="dropdown-item"
                    >
                      Settings
                    </Link>
                    <Link 
                      to="/profile/saved-addresses" 
                      className="dropdown-item"
                    >
                      Saved Addresses
                    </Link>
                    <Link 
                      to="/deposit" 
                      className={`dropdown-item ${location.pathname === '/deposit' ? 'active' : ''}`}
                      aria-current={location.pathname === '/deposit' ? 'page' : undefined}
                    >
                      Deposit USDT
                    </Link>
                    <Link 
                      to="/withdraw" 
                      className={`dropdown-item ${location.pathname === '/withdraw' ? 'active' : ''}`}
                      aria-current={location.pathname === '/withdraw' ? 'page' : undefined}
                    >
                      Withdraw USDT
                    </Link>
                  </div>
                </div>
              </>
            )}
            
            {/* Admin routes */}
            {user?.isAdmin && (
              <div className="dropdown">
                <button className="dropdown-toggle nav-item">
                  Admin <i className="fa-solid fa-chevron-down dropdown-icon" aria-hidden="true"></i>
                  <span className="sr-only">Toggle admin dropdown</span>
                </button>
                <div className="dropdown-menu">
                  <Link 
                    to="/admin/deposits" 
                    className="dropdown-item"
                  >
                    Manage Deposits
                  </Link>
                  <Link 
                    to="/admin/withdrawals" 
                    className="dropdown-item"
                  >
                    Manage Withdrawals
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="auth-buttons">
            {user ? (
              <button 
                onClick={logout} 
                className="button auth-button logout-button"
                aria-label="Log out of your account"
              >
                Log Out
              </button>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="button text auth-button login-button"
                  aria-label="Log in to your account"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="button auth-button register-button"
                  aria-label="Create a new account"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 