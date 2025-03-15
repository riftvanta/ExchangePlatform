import { ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
// Import only the components needed for initial load
import { ToastContainer as CustomToastContainer } from './components/ui/Toast';
import { Layout } from './components/ui';
import { PageTransition } from './components/ui/animation';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence } from 'framer-motion';

// Lazy load pages that aren't needed immediately
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'));
const WithdrawalPage = lazy(() => import('./pages/WithdrawalPage'));
const DepositPage = lazy(() => import('./pages/DepositPage'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const HomePage = lazy(() => import('./pages/HomePage'));

// Lazy load admin pages
const AdminDepositsPage = lazy(() => import('./pages/admin/AdminDepositsPage'));
const AdminWithdrawalsPage = lazy(() => import('./pages/admin/AdminWithdrawalsPage'));

// Lazy load the Dashboard component
const LazyDashboard = lazy(() => import('./components/LazyDashboard'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="page-loading" role="status" aria-live="polite">
    <div className="loading-spinner" aria-hidden="true"></div>
    <p>Loading...</p>
  </div>
);

// Protected Route component that checks for authentication
// and redirects to login if user is not authenticated
interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div role="status" aria-live="polite">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Admin Only component that checks if the user is an admin
function AdminOnly({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div role="status" aria-live="polite">Loading...</div>;

    if (!user?.isAdmin) {
        return <div role="alert">Error: You are not authorized</div>;
    }

    return <>{children}</>;
}

// Main App Content component - separated to use router hooks
function AppContent() {
    const location = useLocation();
    const { user } = useAuth();
    const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/resend-verification'].includes(location.pathname);
    
    return (
        <div className={isAuthPage ? "App-auth" : "App"} role="application">
            {/* Layout component handles navbar visibility based on the route */}
            <Layout>
                <main id="main-content">
                    <AnimatePresence mode="wait">
                        <Suspense fallback={<LoadingFallback />}>
                            <Routes>
                                {/* Public Home Page */}
                                <Route path="/" element={
                                    <PageTransition>
                                        <HomePage />
                                    </PageTransition>
                                } />
                                
                                {/* Public routes */}
                                <Route path="/login" element={
                                    <PageTransition>
                                        <LoginPage />
                                    </PageTransition>
                                } />
                                <Route path="/register" element={
                                    <PageTransition>
                                        <RegisterPage />
                                    </PageTransition>
                                } />
                                {/* Email verification and password reset routes */}
                                <Route path="/verify-email" element={
                                    <PageTransition>
                                        <VerifyEmail />
                                    </PageTransition>
                                } />
                                <Route path="/forgot-password" element={
                                    <PageTransition>
                                        <ForgotPassword />
                                    </PageTransition>
                                } />
                                <Route path="/reset-password" element={
                                    <PageTransition>
                                        <ResetPassword />
                                    </PageTransition>
                                } />
                                <Route path="/resend-verification" element={
                                    <PageTransition>
                                        <ResendVerification />
                                    </PageTransition>
                                } />

                                {/* Protected routes */}
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <PageTransition>
                                                <LazyDashboard />
                                            </PageTransition>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <PageTransition>
                                                <ProfilePage />
                                            </PageTransition>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile/settings"
                                    element={
                                        <ProtectedRoute>
                                            <PageTransition>
                                                <ProfileSettingsPage />
                                            </PageTransition>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile/saved-addresses"
                                    element={
                                        <ProtectedRoute>
                                            <PageTransition>
                                                <ProfileSettingsPage />
                                            </PageTransition>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/deposit"
                                    element={
                                        <ProtectedRoute>
                                            <PageTransition>
                                                <DepositPage />
                                            </PageTransition>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/withdraw"
                                    element={
                                        <ProtectedRoute>
                                            <PageTransition>
                                                <WithdrawalPage />
                                            </PageTransition>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/deposits"
                                    element={
                                        <ProtectedRoute>
                                            <AdminOnly>
                                                <PageTransition>
                                                    <AdminDepositsPage />
                                                </PageTransition>
                                            </AdminOnly>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/withdrawals"
                                    element={
                                        <ProtectedRoute>
                                            <AdminOnly>
                                                <PageTransition>
                                                    <AdminWithdrawalsPage />
                                                </PageTransition>
                                            </AdminOnly>
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </AnimatePresence>
                </main>
            </Layout>
            
            {/* Screen reader announcer for dynamic content */}
            <div id="screen-reader-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>
        </div>
    );
}

// Root App component
function App() {
    return (
        <BrowserRouter>
            <AppContent />
            {/* Use our enhanced Toast container for notifications */}
            <CustomToastContainer />
        </BrowserRouter>
    );
}

export default App;
