import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '../context/AuthContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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
                <h2 id="wallet-balances-heading">Wallet Balances</h2>
                <button 
                    className="refresh-balance-btn"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    aria-label="Refresh wallet balances"
                >
                    <span className={`${isRefreshing ? 'loading-spinner-small' : ''}`}></span>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                            <Link to="/deposit" className="balance-action-btn deposit">
                                Deposit
                            </Link>
                            <Link to="/withdraw" className="balance-action-btn withdraw">
                                Withdraw
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WalletBalances;
