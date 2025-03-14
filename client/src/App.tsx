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
import SpecializedComponentsPage from './pages/SpecializedComponentsPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Joy UI components
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import theme from './theme';
import { DashboardJoy } from './components/ui';

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

// Simple Dashboard component - kept for reference but now redirects to Joy UI version
const Dashboard = () => {
    return <Navigate to="/" replace />;
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

                        {/* Specialized Components Page */}
                        <Route
                            path="/specialized-components"
                            element={
                                <ProtectedRoute>
                                    <SpecializedComponentsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Legacy Dashboard route - redirects to Joy UI Dashboard */}
                        <Route
                            path="/dashboard-legacy"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <DashboardJoy />
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
