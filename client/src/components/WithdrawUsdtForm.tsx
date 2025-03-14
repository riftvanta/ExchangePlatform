import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface WithdrawData {
    amount: string;
    walletAddress: string;
}

function WithdrawUsdtForm() {
    const [amount, setAmount] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    // Fetch wallet data to show current balance
    const { data: wallets, isLoading: isLoadingWallets } = useQuery({
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
        <div>
            <h3>Withdraw USDT</h3>
            
            {/* Balance Display */}
            {isLoadingWallets ? (
                <div className="loading-spinner" role="status" aria-label="Loading wallet balance">
                    <span className="sr-only">Loading your wallet balance...</span>
                </div>
            ) : usdtWallet ? (
                <div className="wallet-balance">
                    <strong>Available Balance:</strong> <span className="balance-amount">{usdtBalance} USDT</span>
                </div>
            ) : (
                <div className="verification-banner" role="alert">
                    <div className="message">
                        <span role="img" aria-label="Warning">⚠️</span> You need to create a USDT wallet first
                    </div>
                </div>
            )}
            
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="verification-banner" style={{ backgroundColor: '#e6f7ef', borderColor: '#84e1bc' }} role="alert">
                    <div className="message" style={{ color: '#0d7d4d' }}>
                        <span role="img" aria-label="Success">✅</span> {successMessage}
                    </div>
                </div>
            )}
            
            {error && (
                <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                    <div className="message" style={{ color: '#b91c1c' }}>
                        <span role="img" aria-label="Error">❌</span> {error}
                    </div>
                </div>
            )}
            
            {/* Withdrawal Form */}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="amount">Amount (USDT):</label>
                    <input
                        id="amount"
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter withdrawal amount"
                        required
                        disabled={!usdtWallet}
                        aria-describedby={error ? "amount-error" : undefined}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="walletAddress">Destination Wallet Address:</label>
                    <input
                        id="walletAddress"
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter TRC20 wallet address"
                        required
                        disabled={!usdtWallet}
                        aria-describedby={error ? "address-error" : undefined}
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={isLoading || !usdtWallet}
                    className="button"
                    aria-busy={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Request Withdrawal'}
                </button>
            </form>
            
            <div className="instructions">
                <div className="verification-banner" style={{ marginTop: '20px', backgroundColor: '#fff7ed', borderColor: '#fdba74' }}>
                    <div className="message" style={{ color: '#9a3412' }}>
                        <span role="img" aria-label="Important">ℹ️</span> <strong>Important Information:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>Withdrawal requests are subject to admin approval</li>
                            <li>Your funds will not be deducted until your request is approved</li>
                            <li>Double-check the destination wallet address before submitting</li>
                            <li>We cannot recover funds sent to incorrect addresses</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WithdrawUsdtForm; 