import React, { lazy, Suspense, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { announceToScreenReader } from '../utils/accessibility';

// Lazy load components
const WalletBalances = lazy(() => import('./WalletBalances'));
const CreateWalletForm = lazy(() => import('./CreateWalletForm'));
const DepositUsdtForm = lazy(() => import('./DepositUsdtForm'));
const WithdrawUsdtForm = lazy(() => import('./WithdrawUsdtForm'));
const TransactionHistory = lazy(() => import('./TransactionHistory'));

// Skeleton loader components
const BalancesSkeleton = () => (
  <div className="skeleton-loader" role="status" aria-label="Loading wallet balances">
    <div className="skeleton-header" aria-hidden="true"></div>
    <div className="skeleton-line" aria-hidden="true"></div>
    <div className="skeleton-line" aria-hidden="true"></div>
    <div className="skeleton-line" aria-hidden="true"></div>
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
  const { logout } = useAuth();
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

  // Handle keyboard shortcut for logout
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Alt + Q for logout
    if (e.altKey && e.key === 'q') {
      logout();
      announceToScreenReader('Logging out', 'assertive');
    }
  };

  return (
    <div 
      className="dashboard" 
      ref={mainContentRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
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
        aria-labelledby="wallet-balances-heading"
      >
        <h2 id="wallet-balances-heading">Wallet Balances</h2>
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
      
      <div className="transaction-section" role="group" aria-label="Transaction Operations">
        <section 
          className="dashboard-section" 
          aria-labelledby="deposit-heading"
        >
          <h2 id="deposit-heading">Deposit USDT</h2>
          <Suspense fallback={<FormSkeleton />}>
            <DepositUsdtForm />
          </Suspense>
        </section>
        <section 
          className="dashboard-section" 
          aria-labelledby="withdraw-heading"
        >
          <h2 id="withdraw-heading">Withdraw USDT</h2>
          <Suspense fallback={<FormSkeleton />}>
            <WithdrawUsdtForm />
          </Suspense>
        </section>
      </div>
      
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
      
      <button 
        onClick={logout}
        className="button"
        style={{ marginTop: 'var(--spacing-lg)' }}
        aria-label="Logout from account"
      >
        Logout
      </button>
    </div>
  );
};

export default LazyDashboard; 