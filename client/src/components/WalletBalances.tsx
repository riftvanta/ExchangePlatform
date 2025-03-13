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
    return <div>Loading wallets...</div>;
  }

  if (isError) {
    return <div>Error loading wallets</div>;
  }

  return (
    <div>
      <h2>Wallet Balances</h2>
      <table>
        <thead>
          <tr>
            <th>Currency</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {wallets?.map((wallet) => (
            <tr key={wallet.id}>
              <td>{wallet.currency}</td>
              <td>{wallet.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WalletBalances; 