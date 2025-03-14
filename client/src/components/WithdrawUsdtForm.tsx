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
        <div>
            {usdtWallet ? (
                <div className="wallet-info">
                    <strong>Available Balance:</strong> {usdtBalance} USDT
                </div>
            ) : (
                <div className="alert warning">
                    You need to create a USDT wallet first
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="withdraw-form">
                <div className="form-group">
                    <label htmlFor="amount">Amount (USDT):</label>
                    <input
                        id="amount"
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        required
                        disabled={!usdtWallet}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="walletAddress">Destination Wallet Address:</label>
                    <input
                        id="walletAddress"
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter wallet address"
                        required
                        disabled={!usdtWallet}
                    />
                </div>
                {error && <div className="alert error">{error}</div>}
                {successMessage && <div className="alert success">{successMessage}</div>}
                <button 
                    type="submit" 
                    disabled={isLoading || !usdtWallet}
                    className="button"
                >
                    {isLoading ? 'Processing...' : 'Request Withdrawal'}
                </button>
            </form>
            <div className="instructions">
                <p><strong>Important:</strong> Withdrawal requests are subject to admin approval. Your funds will not be deducted until your request is approved.</p>
                <p>Please double-check the destination wallet address before submitting. We cannot recover funds sent to incorrect addresses.</p>
            </div>
        </div>
    );
}

export default WithdrawUsdtForm; 