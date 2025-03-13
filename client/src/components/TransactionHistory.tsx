import { useQuery } from '@tanstack/react-query';

interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: string;
  currency: string;
  amount: string;
  transactionHash: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fileKey: string | null;
  rejectionReason: string | null;
}

function TransactionHistory() {
  const {
    data: transactions,
    isLoading,
    isError,
  } = useQuery<Transaction[], Error>({ // Use the Transaction interface
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data = await response.json();
      return data.transactions;
    },
  });

  if (isLoading) {
    return <div>Loading transaction history...</div>;
  }

  if (isError) {
    return <div>Error loading transaction history</div>;
  }

  return (
    <div>
      <h2>Transaction History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Currency</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Transaction Hash</th>
            <th>File Key</th>
            <th>Rejection Reason</th>
          </tr>
        </thead>
        <tbody>
          {transactions?.map((transaction) => (
            <tr key={transaction.id}>
              <td>{new Date(transaction.createdAt).toLocaleString()}</td>
              <td>{transaction.type}</td>
              <td>{transaction.currency}</td>
              <td>{transaction.amount}</td>
              <td>{transaction.status}</td>
              <td>{transaction.transactionHash}</td>
              <td>{transaction.fileKey}</td>
              <td>{transaction.status === 'rejected' ? transaction.rejectionReason : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionHistory; 