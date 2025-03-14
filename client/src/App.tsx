import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import WalletBalances from './components/WalletBalances';
import CreateWalletForm from './components/CreateWalletForm';
import DepositUsdtForm from './components/DepositUsdtForm';
import WithdrawUsdtForm from './components/WithdrawUsdtForm';
import TransactionHistory from './components/TransactionHistory';
import AdminDepositsPage from './pages/admin/AdminDepositsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResendVerification from './pages/ResendVerification';
import JoyUIExamplePage from './pages/JoyUIExamplePage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Joy UI components
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import theme from './theme';

// Protected Route component that checks for authentication
// and redirects to login if user is not authenticated
interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Admin Only component that checks if the user is an admin
function AdminOnly({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    if (!user?.isAdmin) {
        return <div>Error: You are not authorized</div>;
    }

    return <>{children}</>;
}

// Simple Dashboard component
const Dashboard = () => {
    const { logout } = useAuth();
    const { user } = useAuth();

    return (
        <div className="dashboard">
            <h2>Dashboard</h2>
            
            {user && !user.emailVerified && (
                <div className="verification-banner">
                    <div className="message">
                        <span role="img" aria-label="Warning">⚠️</span> Email not verified - Some features may be limited.
                    </div>
                    <Link 
                        to="/resend-verification" 
                        className="button text"
                    >
                        Verify your email
                    </Link>
                </div>
            )}
            
            <div className="nav-links">
                <Link to="/profile" className="nav-link">
                    View Profile
                </Link>
                {/* Joy UI Example link */}
                <Link to="/joy-ui-examples" className="nav-link">
                    Joy UI Examples
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
            
            <div className="dashboard-section">
                <h2>Wallet Balances</h2>
                <WalletBalances />
            </div>
            
            <div className="dashboard-section">
                <h2>Create New Wallet</h2>
                <CreateWalletForm />
            </div>
            
            <div className="transaction-section">
                <div className="dashboard-section">
                    <h2>Deposit USDT</h2>
                    <DepositUsdtForm />
                </div>
                <div className="dashboard-section">
                    <h2>Withdraw USDT</h2>
                    <WithdrawUsdtForm />
                </div>
            </div>
            
            <div className="dashboard-section">
                <h2>Transaction Records</h2>
                <div className="single-section">
                    <TransactionHistory />
                </div>
            </div>
            
            <button 
                onClick={logout}
                className="button"
                style={{ marginTop: 'var(--spacing-lg)' }}
            >
                Logout
            </button>
        </div>
    );
};

function App() {
    const location = window.location.pathname;
    const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/resend-verification'].includes(location);
    
    return (
        <CssVarsProvider theme={theme} defaultMode="light">
            {/* CssBaseline normalizes browser styles */}
            <CssBaseline />
            
            <div className={isAuthPage ? "App-auth" : "App"}>
                {!isAuthPage && (
                    <div className="App-header">
                        <h1>USDT-JOD Exchange Platform</h1>
                    </div>
                )}

                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        {/* Email verification and password reset routes */}
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/resend-verification" element={<ResendVerification />} />

                        {/* Joy UI Example Page */}
                        <Route
                            path="/joy-ui-examples"
                            element={
                                <ProtectedRoute>
                                    <JoyUIExamplePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/deposits"
                            element={
                                <ProtectedRoute>
                                    <AdminOnly>
                                        <AdminDepositsPage />
                                    </AdminOnly>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/withdrawals"
                            element={
                                <ProtectedRoute>
                                    <AdminOnly>
                                        <AdminWithdrawalsPage />
                                    </AdminOnly>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
                
                {/* Add Toast container for notifications */}
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
        </CssVarsProvider>
    );
}

export default App;
