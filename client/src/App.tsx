import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProfilePage from './pages/ProfilePage';
import WalletBalances from './components/WalletBalances';
import CreateWalletForm from './components/CreateWalletForm';
import DepositUsdtForm from './components/DepositUsdtForm';
import WithdrawUsdtForm from './components/WithdrawUsdtForm';
import TransactionHistory from './components/TransactionHistory';
import WithdrawalHistory from './components/WithdrawalHistory';
import AdminDepositsPage from './pages/admin/AdminDepositsPage';
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage';

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
            <div className="dashboard-links">
                <Link
                    to="/profile"
                    style={{
                        display: 'inline-block',
                        margin: '1rem 0',
                        color: '#646cff',
                        textDecoration: 'none',
                    }}
                >
                    View Profile
                </Link>
                {/* Admin links - only visible to admins */}
                {user?.isAdmin && (
                    <>
                        <Link
                            to="/admin/deposits"
                            style={{
                                display: 'inline-block',
                                margin: '1rem 0 1rem 1rem',
                                color: '#646cff',
                                textDecoration: 'none',
                            }}
                        >
                            Manage Deposits
                        </Link>
                        <Link
                            to="/admin/withdrawals"
                            style={{
                                display: 'inline-block',
                                margin: '1rem 0 1rem 1rem',
                                color: '#646cff',
                                textDecoration: 'none',
                            }}
                        >
                            Manage Withdrawals
                        </Link>
                    </>
                )}
            </div>
            <WalletBalances />
            <CreateWalletForm />
            
            <div className="transaction-section" style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                marginTop: '20px'
            }}>
                <div style={{ flex: '1 1 400px' }}>
                    <DepositUsdtForm />
                </div>
                <div style={{ flex: '1 1 400px' }}>
                    <WithdrawUsdtForm />
                </div>
            </div>
            
            <div className="history-section" style={{ marginTop: '30px' }}>
                <h2>Transaction Records</h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 400px' }}>
                        <TransactionHistory />
                    </div>
                    <div style={{ flex: '1 1 400px' }}>
                        <WithdrawalHistory />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={logout}
                style={{ marginTop: '30px' }}
            >
                Logout
            </button>
        </div>
    );
};

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>USDT-JOD Exchange Platform</h1>
            </header>
            <main>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/register" element={<RegisterForm />} />
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
            </main>
        </div>
    );
}

export default App;
