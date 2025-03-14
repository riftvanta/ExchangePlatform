import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

// Import Joy UI components
import { 
  Alert, 
  Button, 
  FormControl, 
  Input, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Divider
} from './index';

interface WithdrawData {
  amount: string;
  walletAddress: string;
}

function WithdrawUsdtFormJoy() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch wallet data to show current balance
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const response = await fetch('/api/wallet');
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }
      const data = await response.json();
      return data.wallets;
    },
  });

  // Find USDT wallet and get balance
  const usdtWallet = wallets?.find((wallet: { currency: string }) => wallet.currency === 'USDT');
  const usdtBalance = usdtWallet?.balance || '0';

  const withdrawMutation = useMutation<any, Error, WithdrawData>({
    mutationFn: async (data: WithdrawData) => {
      try {
        const response = await fetch('/api/withdraw/usdt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Withdrawal request failed');
        }

        return responseData;
      } catch (err: any) {
        console.error('Withdrawal error:', err);
        // Re-throw the error with more context if possible
        if (err.message) {
          throw new Error(`Error: ${err.message}`);
        } else {
          throw new Error('Network or server error occurred');
        }
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setAmount(''); // Clear form
      setWalletAddress(''); // Clear form
      setError(null);
      setSuccessMessage(data.message); // Set success message from the response
    },
    onError: (err: Error) => {
      setError(err.message || 'Withdrawal request failed');
      setSuccessMessage(null); // Clear success message on error
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!walletAddress?.trim()) {
      setError('Please enter a valid wallet address');
      return;
    }
    
    // Check if the amount is within balance
    if (parseFloat(amount) > parseFloat(usdtBalance)) {
      setError('Insufficient balance');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await withdrawMutation.mutateAsync({ amount, walletAddress });
    } catch (error) {
      console.error('Withdrawal submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        {usdtWallet ? (
          <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
            <Typography level="body-lg" sx={{ fontWeight: 'bold', mr: 1 }}>Available Balance:</Typography>
            <Typography level="body-lg">{usdtBalance} USDT</Typography>
          </Box>
        ) : (
          <Alert color="warning" sx={{ mb: 2 }}>
            You need to create a USDT wallet first
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormControl
            label="Amount (USDT)"
            error={Boolean(error && error.includes('amount'))}
            errorText={error?.includes('amount') ? error : undefined}
          >
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={!usdtWallet}
            />
          </FormControl>
          
          <FormControl
            label="Destination Wallet Address"
            error={Boolean(error && error.includes('wallet address'))}
            errorText={error?.includes('wallet address') ? error : undefined}
          >
            <Input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address"
              disabled={!usdtWallet}
            />
          </FormControl>
          
          {error && !error.includes('amount') && !error.includes('wallet address') && (
            <Alert color="danger" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert color="success" sx={{ my: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading || !usdtWallet}
            loading={isLoading}
            sx={{ mt: 2, width: '100%' }}
          >
            {isLoading ? 'Processing...' : 'Request Withdrawal'}
          </Button>
        </form>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mt: 2 }}>
          <Typography level="title-md" sx={{ mb: 1 }}>Important Information</Typography>
          <Typography level="body-sm" sx={{ mb: 1 }}>
            <strong>Important:</strong> Withdrawal requests are subject to admin approval. Your funds will not be deducted until your request is approved.
          </Typography>
          <Typography level="body-sm">
            Please double-check the destination wallet address before submitting. We cannot recover funds sent to incorrect addresses.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default WithdrawUsdtFormJoy; 