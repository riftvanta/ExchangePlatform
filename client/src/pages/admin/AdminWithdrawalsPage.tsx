import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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
  rejectionReason?: string | null;
}

function AdminWithdrawalsPage() {
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingTransactionId, setRejectingTransactionId] = useState<string | null>(null);
  const [approvingTransactionIds, setApprovingTransactionIds] = useState<{ [key: string]: boolean }>({});
  const [rejectingTransactionIds, setRejectingTransactionIds] = useState<{ [key: string]: boolean }>({});

  const {
    data: pendingWithdrawals,
    isLoading,
    isError,
  } = useQuery<Transaction[], Error>({
    queryKey: ['admin', 'withdrawals'],
    queryFn: async () => {
      const response = await fetch('/api/admin/withdrawals');
      if (!response.ok) {
        throw new Error('Failed to fetch pending withdrawals');
      }
      const data = await response.json();
      return data.withdrawals; // Correctly access the withdrawals array
    },
  });

  const queryClient = useQueryClient();

  const approveMutation = useMutation<any, Error, string>({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/admin/withdrawals/${transactionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve withdrawal');
      }
      return response.json();
    },
    onMutate: (transactionId: string) => {
      setApprovingTransactionIds(prev => ({ ...prev, [transactionId]: true }));
    },
    onSuccess: (data: any, transactionId: string) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      setError(null);
      setApprovingTransactionIds(prev => {
        const newState = { ...prev };
        delete newState[transactionId];
        return newState;
      });
    },
    onError: (err: Error, transactionId: string) => {
      setError(err.message || 'Failed to approve withdrawal');
        setApprovingTransactionIds(prev => {
        const newState = { ...prev };
        delete newState[transactionId];
        return newState;
      });
    }
  });

  interface RejectParams {
    transactionId: string;
    rejectionReason: string;
  }

  const rejectMutation = useMutation<any, Error, RejectParams>({
    mutationFn: async ({ transactionId, rejectionReason }: RejectParams) => {
      const response = await fetch(`/api/admin/withdrawals/${transactionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject withdrawal');
      }
      return response.json();
    },
    onMutate: ({transactionId}: RejectParams) => {
        setRejectingTransactionIds(prev => ({ ...prev, [transactionId]: true }));
      },
    onSuccess: (data: any, {transactionId}: RejectParams) => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
        setError(null);
        setRejectingTransactionIds(prev => {
          const newState = { ...prev };
          delete newState[transactionId];
          return newState;
        });
        setRejectingTransactionId(null);
        setRejectionReason('');
    },
    onError: (err: Error, {transactionId}: RejectParams) => {
        setError(err.message || 'Failed to reject withdrawal');
        setRejectingTransactionIds(prev => {
          const newState = { ...prev };
          delete newState[transactionId];
          return newState;
        });
    }
  });

  const handleApprove = (transactionId: string) => {
    approveMutation.mutate(transactionId);
  };

  const handleReject = (transactionId: string) => {
      setRejectingTransactionId(transactionId);
      setError(null); // Clear any previous error.
  };

  const handleConfirmReject = async () => {
      if (rejectingTransactionId) {
          try {
            await rejectMutation.mutateAsync({
              transactionId: rejectingTransactionId, 
              rejectionReason
            });
          } catch(error: any) {
              //Already handled by mutation onError
          }
          finally {
            setRejectingTransactionId(null);
            setRejectionReason('');
          }
      }
  };

  const handleCancelReject = () => {
      setRejectingTransactionId(null);
      setRejectionReason('');
  }

if (isLoading) {
  return <div>Loading pending withdrawals...</div>;
}

if (isError) {
  return <div>Error loading pending withdrawals</div>;
}

return (
  <div>
    <h2>Pending Withdrawals (Admin)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {rejectingTransactionId && (
          <div>
          <p>Reason for rejecting transaction {rejectingTransactionId}:</p>
          <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
          />
          <button onClick={handleConfirmReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
          <button onClick={handleCancelReject}>Cancel</button>
          </div>
      )}
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Wallet ID</th>
          <th>Type</th>
          <th>Currency</th>
          <th>Amount</th>
          <th>Transaction Hash</th>
          <th>Created At</th>
          <th>Updated At</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pendingWithdrawals?.map((transaction) => (
          <tr key={transaction.id}>
            <td>{transaction.id}</td>
            <td>{transaction.userId}</td>
            <td>{transaction.walletId}</td>
            <td>{transaction.type}</td>
            <td>{transaction.currency}</td>
            <td>{transaction.amount}</td>
            <td>{transaction.transactionHash}</td>
            <td>{transaction.createdAt}</td>
            <td>{transaction.updatedAt}</td>
            <td>{transaction.status}</td>
            <td>
              <button
                  onClick={() => handleApprove(transaction.id)}
                  disabled={approvingTransactionIds[transaction.id] || rejectingTransactionIds[transaction.id]}
              >
                  {approvingTransactionIds[transaction.id] ? 'Approving...' : 'Approve'}
              </button>
              <button
                  onClick={() => handleReject(transaction.id)}
                  disabled={approvingTransactionIds[transaction.id] || rejectingTransactionIds[transaction.id]}
              >
                  Reject
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}

export default AdminWithdrawalsPage; 