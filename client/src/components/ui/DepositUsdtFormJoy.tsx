import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

// Import our Joy UI components
import { 
  Typography, 
  Button, 
  Alert, 
  Card, 
  CardContent, 
  Grid, 
  Box, 
  Divider,
  Chip,
  FormControl,
  Input,
  FileUpload,
  CircularProgress,
  Notification
} from './index';

interface DepositData {
  amount: string;
  transactionHash: string;
  fileKey: string;
  depositAddress?: string;
}

interface DepositAddress {
  id: string;
  address: string;
  currency: string;
  network: string;
  isActive: boolean;
  lastUsed?: string;
  label?: string;
}

function DepositUsdtFormJoy() {
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const queryClient = useQueryClient();

  // Fetch the user's USDT deposit address
  const { data: depositAddresses, isLoading: isLoadingAddresses, error: addressError } = useQuery({
    queryKey: ['depositAddresses', 'USDT', 'TRC20'],
    queryFn: async () => {
      const response = await fetch('/api/deposit-address?currency=USDT&network=TRC20', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deposit address');
      }
      
      return response.json();
    }
  });

  // Mutation to create a new deposit address
  const createAddressMutation = useMutation({
    mutationFn: async () => {
      setIsAddressLoading(true);
      
      const response = await fetch('/api/deposit-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: 'USDT', network: 'TRC20' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deposit address');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depositAddresses', 'USDT', 'TRC20'] });
      setIsAddressLoading(false);
      Notification.success('Deposit address created successfully', 'Success');
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create deposit address');
      setIsAddressLoading(false);
      Notification.error(err.message || 'Failed to create deposit address', 'Error');
    },
  });

  const depositMutation = useMutation<any, Error, DepositData>({
    mutationFn: async (data: DepositData) => {
      const response = await fetch('/api/deposit/usdt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deposit failed');
      }

      return response.json(); // We now expect a JSON response with a message
    },
    onSuccess: (data) => {
      // data now contains the response from the server.
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setAmount(''); // Clear form
      setTransactionHash(''); // Clear form
      setFileKey(null); // Clear file key
      setError(null);
      setSuccessMessage(data.message); // Set success message from the response.
      Notification.success(data.message || 'Deposit submitted successfully', 'Success');
    },
    onError: (err: Error) => {
      setError(err.message || 'Deposit failed');
      setSuccessMessage(null); // Clear success message on error
      Notification.error(err.message || 'Deposit failed', 'Error');
    },
  });

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const selectedFile = files[0];
    
    try {
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: selectedFile.type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadURL, key } = await response.json();

      // Upload file directly to S3.
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      setFileKey(key);
      Notification.success('File uploaded successfully', 'Success');
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      Notification.error(error.message || 'Upload failed', 'Error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileKey) {
      setError('Please upload a deposit screenshot first');
      Notification.warning('Please upload a deposit screenshot first', 'Missing Information');
      return;
    }
    
    // Include the deposit address in the request if available
    const depositData: DepositData = { 
      amount, 
      transactionHash, 
      fileKey 
    };
    
    // Add deposit address if available
    if (userAddress) {
      depositData.depositAddress = userAddress.address;
    }
    
    depositMutation.mutateAsync(depositData);
  };

  const copyAddressToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        setIsCopied(true);
        Notification.success('Address copied to clipboard', 'Copied!');
        setTimeout(() => setIsCopied(false), 3000); // Reset after 3 seconds
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
        Notification.error('Failed to copy address', 'Error');
      });
  };

  // Get the user's deposit address if available
  const userAddress = depositAddresses?.addresses?.length > 0 
    ? depositAddresses.addresses[0]
    : null;

  return (
    <Box>
      {/* Deposit Address Section */}
      <Box sx={{ mb: 3 }}>
        <Typography level="h3" sx={{ mb: 2 }}>Your Personal USDT Deposit Address (TRC20)</Typography>
        
        {isLoadingAddresses || isAddressLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
            <CircularProgress size="sm" />
            <Typography>Loading your deposit address...</Typography>
          </Box>
        ) : addressError ? (
          <Alert color="danger" sx={{ mb: 2 }}>Error loading deposit address</Alert>
        ) : !userAddress ? (
          <Alert 
            color="warning" 
            sx={{ mb: 2 }}
            endDecorator={
              <Button 
                onClick={() => createAddressMutation.mutate()}
                disabled={createAddressMutation.isPending}
                size="sm"
                color="warning"
                variant="soft"
              >
                Generate Address
              </Button>
            }
          >
            No deposit address found.
          </Alert>
        ) : (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                mb: 1 
              }}>
                <Typography 
                  level="body-md" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    p: 1,
                    bgcolor: 'background.level1',
                    borderRadius: 'sm',
                    wordBreak: 'break-all'
                  }}
                >
                  {userAddress.address}
                </Typography>
                <Button 
                  onClick={() => copyAddressToClipboard(userAddress.address)}
                  variant="soft"
                  color={isCopied ? "success" : "primary"}
                  size="sm"
                  startDecorator={isCopied ? "✓" : null}
                >
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ mt: 1 }}>
                <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <strong>Network:</strong> 
                  <Chip size="sm" color="primary">TRC20 (TRON)</Chip>
                </Typography>
                <Typography level="body-sm" color="warning" sx={{ mt: 1 }}>
                  <strong>Important:</strong> Send only USDT to this address. Sending any other currency may result in permanent loss.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
      
      {/* Deposit Form */}
      <form onSubmit={handleSubmit}>
        <FormControl 
          label="Amount" 
          sx={{ mb: 2 }}
          error={false}
        >
          <Input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter USDT amount"
            required
          />
        </FormControl>
        
        <FormControl 
          label="Transaction Hash" 
          sx={{ mb: 2 }}
          error={false}
          helperText="The transaction ID from your wallet"
        >
          <Input
            type="text"
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            placeholder="Enter transaction hash/ID"
            required
          />
        </FormControl>
        
        <FormControl 
          label="Deposit Screenshot" 
          sx={{ mb: 3 }}
          error={false}
          helperText="Please upload a screenshot of your transaction for verification"
        >
          <FileUpload
            accept="image/*"
            onFileSelect={handleFileUpload}
            buttonText="Upload Screenshot"
            dropzoneText="or drop image here"
          />
        </FormControl>
        
        {error && <Alert color="danger" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert color="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        
        <Button 
          type="submit" 
          disabled={depositMutation.isPending}
          loading={depositMutation.isPending}
          fullWidth
          sx={{ mt: 1 }}
        >
          {depositMutation.isPending ? 'Submitting Deposit...' : 'Deposit USDT'}
        </Button>
      </form>
    </Box>
  );
}

export default DepositUsdtFormJoy; 