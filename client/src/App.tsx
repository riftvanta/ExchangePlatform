import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProfilePage from './pages/ProfilePage';
import WalletBalances from './components/WalletBalances';
import CreateWalletForm from './components/CreateWalletForm';
import DepositUsdtForm from './components/DepositUsdtForm';
import TransactionHistory from './components/TransactionHistory';
import AdminDepositsPage from './pages/admin/AdminDepositsPage';

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
  
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="dashboard-links">
        <Link to="/profile" style={{ 
          display: 'inline-block', 
          margin: '1rem 0', 
          color: '#646cff', 
          textDecoration: 'none' 
        }}>View Profile</Link>
        {/* Admin link - only visible to admins */}
        {useAuth().user?.isAdmin && (
          <Link to="/admin/deposits" style={{ 
            display: 'inline-block', 
            margin: '1rem 0 1rem 1rem', 
            color: '#646cff', 
            textDecoration: 'none' 
          }}>Manage Deposits</Link>
        )}
      </div>
      <WalletBalances />
      <CreateWalletForm />
      <DepositUsdtForm />
      <TransactionHistory />
      <button onClick={logout}>Logout</button>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </main>
    </div>
  );
}

export default App;
