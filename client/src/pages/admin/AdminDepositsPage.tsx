import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSocketStore, SocketEvents, TransactionUpdateData } from '../../lib/socketService';
import { toast } from 'react-toastify';

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

function AdminDepositsPage() {
    const [error, setError] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingTransactionId, setRejectingTransactionId] = useState<
        string | null
    >(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [viewingTransactionId, setViewingTransactionId] = useState<
        string | null
    >(null);
    const socket = useSocketStore(state => state.socket);

    const {
        data: pendingDeposits,
        isLoading,
        isError,
    } = useQuery<Transaction[], Error>({
        // Use the Transaction interface
        queryKey: ['admin', 'deposits'],
        queryFn: async () => {
            const response = await fetch('/api/admin/deposits');
            if (!response.ok) {
                throw new Error('Failed to fetch pending deposits');
            }
            const data = await response.json();
            return data.deposits;
        },
    });

    const queryClient = useQueryClient();

    // Subscribe to real-time new pending transaction notifications
    useEffect(() => {
        if (!socket) return;
        
        // Handle new pending transaction notification
        const handleNewPendingTransaction = (data: TransactionUpdateData) => {
            console.log('New pending transaction received:', data);
            
            // Show toast notification
            toast.info(`New pending ${data.type} of ${data.amount} ${data.currency} received!`, {
                onClick: () => {
                    // Refresh the data when clicking on the notification
                    queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
                    window.scrollTo(0, 0); // Scroll to top to see the new transaction
                }
            });
            
            // Refresh the data automatically
            queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
        };
        
        // Listen for new pending transactions
        socket.on(SocketEvents.NEW_PENDING_TRANSACTION, handleNewPendingTransaction);
        
        // Clean up on unmount
        return () => {
            socket.off(SocketEvents.NEW_PENDING_TRANSACTION, handleNewPendingTransaction);
        };
    }, [socket, queryClient]);

    const approveMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            const response = await fetch(
                `/api/admin/deposits/${transactionId}/approve`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to approve deposit');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
            setError(null); // Clear the error
            toast.success('Deposit approved successfully');
        },
        onError: (err: any) => {
            // Add error handler
            setError(err.message || 'Failed to approve deposit');
            toast.error(err.message || 'Failed to approve deposit');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({
            transactionId,
            rejectionReason,
        }: {
            transactionId: string;
            rejectionReason: string;
        }) => {
            const response = await fetch(
                `/api/admin/deposits/${transactionId}/reject`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ rejectionReason }),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject deposit');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });
            setError(null);
            toast.success('Deposit rejected successfully');
        },
        onError: (err: any) => {
            // Add error handler
            setError(err.message || 'Failed to reject deposit');
            toast.error(err.message || 'Failed to reject deposit');
        },
    });

    const handleApprove = (transactionId: string) => {
        approveMutation.mutate(transactionId);
    };

    const handleReject = (transactionId: string) => {
        setRejectingTransactionId(transactionId);
        setError(null);
    };

    const handleConfirmReject = async () => {
        if (rejectingTransactionId) {
            try {
                await rejectMutation.mutateAsync({
                    transactionId: rejectingTransactionId,
                    rejectionReason,
                });
            } finally {
                setRejectingTransactionId(null);
                setRejectionReason('');
            }
        }
    };

    const handleCancelReject = () => {
        setRejectingTransactionId(null);
        setRejectionReason('');
    };

    const handleViewImage = async (transactionId: string) => {
        try {
            const response = await fetch(
                `/api/admin/deposits/${transactionId}/image`
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get image URL');
            }
            const data = await response.json();
            setImageUrl(data.imageUrl);
            setViewingTransactionId(transactionId);
            setError(null);
        } catch (error: any) {
            setError(error.message || 'Failed to load image');
            setImageUrl(null);
            setViewingTransactionId(null);
        }
    };

    const handleCloseImage = () => {
        setImageUrl(null);
        setViewingTransactionId(null);
    };

    if (isLoading) {
        return <div>Loading pending deposits...</div>;
    }

    if (isError) {
        return <div>Error loading pending deposits</div>;
    }

    return (
        <div>
            <h2>Pending Deposits (Admin)</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {rejectingTransactionId && (
                <div>
                    <p>
                        Reason for rejecting transaction{' '}
                        {rejectingTransactionId}:
                    </p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <button
                        onClick={handleConfirmReject}
                        disabled={rejectMutation.isPending}
                    >
                        {rejectMutation.isPending
                            ? 'Rejecting...'
                            : 'Confirm Rejection'}
                    </button>
                    <button onClick={handleCancelReject}>Cancel</button>
                </div>
            )}

            {imageUrl && viewingTransactionId && (
                <div>
                    <p>Deposit Image:</p>
                    <img
                        src={imageUrl}
                        alt="Deposit Receipt"
                        style={{ maxWidth: '500px', maxHeight: '500px' }}
                    />
                    <button onClick={handleCloseImage}>Close Image</button>
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
                        <th>File Key</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingDeposits?.map((transaction) => (
                        <tr key={transaction.id}>
                            <td>{transaction.id}</td>
                            <td>{transaction.userId}</td>
                            <td>{transaction.walletId}</td>
                            <td>{transaction.type}</td>
                            <td>{transaction.currency}</td>
                            <td>{transaction.amount}</td>
                            <td>{transaction.transactionHash}</td>
                            <td>{transaction.fileKey}</td>
                            <td>{transaction.createdAt}</td>
                            <td>{transaction.updatedAt}</td>
                            <td>{transaction.status}</td>
                            <td>
                                <button
                                    onClick={() =>
                                        handleApprove(transaction.id)
                                    }
                                    disabled={
                                        approveMutation.isPending ||
                                        rejectMutation.isPending
                                    }
                                >
                                    {approveMutation.isPending
                                        ? 'Approving...'
                                        : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleReject(transaction.id)}
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() =>
                                        handleViewImage(transaction.id)
                                    }
                                >
                                    View Image
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDepositsPage;
