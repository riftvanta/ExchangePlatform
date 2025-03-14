import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '../context/AuthContext';
import { useState } from 'react';

interface Wallet {
    id: string;
    userId: string;
    currency: string;
    balance: string;
    createdAt: string;
    updatedAt: string;
}

function WalletBalances() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        data: wallets,
        isLoading,
        isError,
    } = useQuery<Wallet[], Error>({
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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ['wallets'] });
        } finally {
            setTimeout(() => setIsRefreshing(false), 500); // Add a small delay to show the loading state
        }
    };

    // Get the currency icon letter
    const getCurrencyIcon = (currency: string) => {
        return currency.charAt(0);
    };

    // Format the balance with a thousands separator
    const formatBalance = (balance: string) => {
        return parseFloat(balance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    if (isLoading) {
        return (
            <div className="wallet-balances-container">
                <div className="wallet-balances-header">
                    <h2>Wallet Balances</h2>
                </div>
                <div className="loading-container" style={{ padding: '2rem 0', textAlign: 'center' }}>
                    <div className="loading-spinner"></div>
                    <div style={{ marginTop: '1rem' }}>Loading wallets...</div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="wallet-balances-container">
                <div className="wallet-balances-header">
                    <h2>Wallet Balances</h2>
                    <button 
                        className="refresh-balance-btn" 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        aria-label="Refresh balances"
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                    <div className="message" style={{ color: '#b91c1c' }}>
                        <span role="img" aria-label="Error">❌</span> Error loading wallets
                    </div>
                </div>
            </div>
        );
    }

    if (!wallets || wallets.length === 0) {
        return (
            <div className="wallet-balances-container">
                <div className="wallet-balances-header">
                    <h2>Wallet Balances</h2>
                </div>
                <div className="verification-banner" style={{ backgroundColor: '#e6f7ff', borderColor: '#a3bffa' }} role="alert">
                    <div className="message" style={{ color: '#2b6cb0' }}>
                        <span role="img" aria-label="Info">ℹ️</span> No wallets found. Create a wallet to get started.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="wallet-balances-container">
            <div className="wallet-balances-header">
                <h2>Wallet Balances</h2>
                <button 
                    className="refresh-balance-btn" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    aria-label="Refresh balances"
                >
                    {isRefreshing ? (
                        <>
                            <span className="loading-spinner-small" aria-hidden="true"></span>
                            <span>Refreshing...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            <span>Refresh</span>
                        </>
                    )}
                </button>
            </div>
            <div className="wallet-balances-grid">
                {wallets.map((wallet) => (
                    <div className={`balance-card ${wallet.currency.toLowerCase()}`} key={wallet.id}>
                        <div className="currency-name">
                            <span className="currency-icon">{getCurrencyIcon(wallet.currency)}</span>
                            {wallet.currency}
                        </div>
                        <div className="balance-amount">{formatBalance(wallet.balance)}</div>
                        <div className="balance-usd-value">
                            {wallet.currency === 'USDT' ? 'USD Tether' : 'Jordanian Dinar'}
                        </div>
                        <div className="balance-actions">
                            <button className="balance-action-btn deposit" onClick={() => window.location.href = '#deposit-heading'}>
                                Deposit
                            </button>
                            <button className="balance-action-btn withdraw" onClick={() => window.location.href = '#withdraw-heading'}>
                                Withdraw
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WalletBalances;
