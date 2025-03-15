import React, { lazy, Suspense, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { announceToScreenReader } from '../utils/accessibility';

// Lazy load components
const WalletBalances = lazy(() => import('./WalletBalances'));
const CreateWalletForm = lazy(() => import('./CreateWalletForm'));
const TransactionHistory = lazy(() => import('./TransactionHistory'));

// Skeleton loader components
const BalancesSkeleton = () => (
  <div className="wallet-balances-container skeleton-loader" role="status" aria-label="Loading wallet balances">
    <div className="wallet-balances-header" aria-hidden="true">
      <div className="skeleton-header"></div>
    </div>
    <div className="wallet-balances-grid" aria-hidden="true">
      <div className="balance-card skeleton">
        <div className="skeleton-line small"></div>
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
        <div className="skeleton-actions">
          <div className="skeleton-button small"></div>
          <div className="skeleton-button small"></div>
        </div>
      </div>
      <div className="balance-card skeleton">
        <div className="skeleton-line small"></div>
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
        <div className="skeleton-actions">
          <div className="skeleton-button small"></div>
          <div className="skeleton-button small"></div>
        </div>
      </div>
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="skeleton-loader" role="status" aria-label="Loading form">
    <div className="skeleton-header" aria-hidden="true"></div>
    <div className="skeleton-input" aria-hidden="true"></div>
    <div className="skeleton-input" aria-hidden="true"></div>
    <div className="skeleton-button" aria-hidden="true"></div>
  </div>
);

const TransactionSkeleton = () => (
  <div className="skeleton-loader" role="status" aria-label="Loading transaction history">
    <div className="skeleton-header" aria-hidden="true"></div>
    <div className="skeleton-table" aria-hidden="true">
      <div className="skeleton-row"></div>
      <div className="skeleton-row"></div>
      <div className="skeleton-row"></div>
    </div>
  </div>
);

// Lazy Dashboard component
const LazyDashboard = () => {
  const { user } = useAuth();
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Focus on the main content when the component mounts
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
    
    // Announce to screen readers that the dashboard has loaded
    announceToScreenReader('Dashboard loaded');
  }, []);

  // Add keyboard shortcut for logout (Alt+Q)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'q') {
        // Use the logout function directly from AuthContext when needed
        const { logout } = useAuth();
        logout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      className="dashboard" 
      ref={mainContentRef}
      tabIndex={-1}
      role="region" 
      aria-label="User Dashboard"
    >
      <h2 id="dashboard-title">Dashboard</h2>
      
      {user && !user.emailVerified && (
        <div 
          className="verification-banner" 
          role="alert" 
          aria-labelledby="verification-message"
        >
          <div className="message" id="verification-message">
            <span role="img" aria-label="Warning">⚠️</span> Email not verified - Some features may be limited.
          </div>
          <Link 
            to="/resend-verification" 
            className="button text"
            aria-describedby="verification-message"
          >
            Verify your email
          </Link>
        </div>
      )}
      
      <nav aria-label="Dashboard navigation">
        <div className="nav-links">
          <Link to="/profile" className="nav-link">
            View Profile
          </Link>
          <Link to="/profile/settings" className="nav-link">
            Settings
          </Link>
          <Link to="/deposit" className="nav-link">
            Deposit USDT
          </Link>
          <Link to="/withdraw" className="nav-link">
            Withdraw USDT
          </Link>
          {/* Admin links - only visible to admins */}
          {user?.isAdmin && (
            <>
              <Link to="/admin/deposits" className="nav-link">
                Manage Deposits
              </Link>
              <Link to="/admin/withdrawals" className="nav-link">
                Manage Withdrawals
              </Link>
            </>
          )}
        </div>
      </nav>
      
      <section 
        className="dashboard-section" 
        aria-labelledby="welcome-heading"
      >
        <h2 id="welcome-heading">Welcome, {user?.firstName || 'User'}!</h2>
        <p>
          This is your USDT-JOD exchange dashboard where you can manage your wallets, 
          make deposits, and request withdrawals.
        </p>
      </section>
      
      <section 
        className="dashboard-section wallet-section" 
        aria-labelledby="wallet-balances-heading"
      >
        <Suspense fallback={<BalancesSkeleton />}>
          <WalletBalances />
        </Suspense>
      </section>
      
      <section 
        className="dashboard-section" 
        aria-labelledby="create-wallet-heading"
      >
        <h2 id="create-wallet-heading">Create New Wallet</h2>
        <Suspense fallback={<FormSkeleton />}>
          <CreateWalletForm />
        </Suspense>
      </section>
      
      <section 
        className="dashboard-section" 
        aria-labelledby="transaction-records-heading"
      >
        <h2 id="transaction-records-heading">Transaction Records</h2>
        <div className="single-section">
          <Suspense fallback={<TransactionSkeleton />}>
            <TransactionHistory />
          </Suspense>
        </div>
      </section>
      
      <div className="keyboard-shortcuts sr-only" aria-live="polite">
        <p>Keyboard shortcuts: Alt+Q to logout</p>
      </div>
    </div>
  );
};

export default LazyDashboard; 