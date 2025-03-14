import { useQuery } from '@tanstack/react-query';
import { User } from '../context/AuthContext';

interface Wallet {
    id: string;
    userId: string;
    currency: string;
    balance: string;
    createdAt: string;
    updatedAt: string;
}

function WalletBalances() {
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

    if (isLoading) {
        return <div className="loading">Loading wallets...</div>;
    }

    if (isError) {
        return <div className="alert error">Error loading wallets</div>;
    }

    if (!wallets || wallets.length === 0) {
        return <div className="alert info">No wallets found. Create a wallet to get started.</div>;
    }

    return (
        <div className="wallet-balances">
            {wallets.map((wallet) => (
                <div className="wallet-card" key={wallet.id}>
                    <div className="currency">{wallet.currency}</div>
                    <div className="balance">{wallet.balance}</div>
                </div>
            ))}
        </div>
    );
}

export default WalletBalances;
