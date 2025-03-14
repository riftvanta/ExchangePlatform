import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WalletBalances from '../WalletBalances';
import CreateWalletFormJoy from './CreateWalletFormJoy';
import WithdrawUsdtFormJoy from './WithdrawUsdtFormJoy';
import TransactionHistoryJoy from './TransactionHistoryJoy';
import DepositUsdtForm from '../DepositUsdtForm';

// Import our Joy UI components
import { 
  Typography, 
  Button, 
  Alert, 
  Card, 
  CardContent, 
  Grid, 
  Box, 
  Sheet,
  Divider,
  AspectRatio,
  Chip
} from './index';

function DashboardJoy() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: 3 
      }}>
        <Typography level="h1">Dashboard</Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          mt: { xs: 2, md: 0 }
        }}>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <Button variant="plain" color="neutral">View Profile</Button>
          </Link>
          
          <Link to="/joy-ui-examples" style={{ textDecoration: 'none' }}>
            <Button variant="plain" color="neutral">Joy UI Examples</Button>
          </Link>
          
          {user?.isAdmin && (
            <>
              <Link to="/admin/deposits" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="primary" startDecorator={<span>📥</span>}>
                  Manage Deposits
                </Button>
              </Link>
              <Link to="/admin/withdrawals" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="primary" startDecorator={<span>📤</span>}>
                  Manage Withdrawals
                </Button>
              </Link>
            </>
          )}
        </Box>
      </Box>

      {user && !user.emailVerified && (
        <Alert 
          color="warning" 
          variant="soft" 
          sx={{ mb: 3 }}
          startDecorator={<span role="img" aria-label="Warning">⚠️</span>}
          endDecorator={
            <Link to="/resend-verification" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="soft" color="warning">
                Verify your email
              </Button>
            </Link>
          }
        >
          Email not verified - Some features may be limited.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Wallet Balances */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2">Wallet Balances</Typography>
              <Divider sx={{ my: 2 }} />
              <WalletBalances />
            </CardContent>
          </Card>
        </Grid>

        {/* Create New Wallet */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2">Create New Wallet</Typography>
              <Divider sx={{ my: 2 }} />
              <CreateWalletFormJoy />
            </CardContent>
          </Card>
        </Grid>

        {/* Deposit USDT */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2">Deposit USDT</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 1 }}>
                <DepositUsdtForm />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Withdraw USDT */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography level="h2">Withdraw USDT</Typography>
              <Divider sx={{ my: 2 }} />
              <WithdrawUsdtFormJoy />
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction Records */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography level="h2">Transaction Records</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 1 }}>
                {/* We'll create this component next */}
                <TransactionHistoryJoy />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button 
          size="lg"
          color="neutral" 
          variant="soft"
          onClick={handleLogout}
          startDecorator={<span>🚪</span>}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default DashboardJoy; 