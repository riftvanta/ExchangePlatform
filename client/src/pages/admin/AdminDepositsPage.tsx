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
    const [processingDepositId, setProcessingDepositId] = useState<string | null>(null);
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
            setProcessingDepositId(null);
        },
        onError: (err: any) => {
            // Add error handler
            setError(err.message || 'Failed to approve deposit');
            toast.error(err.message || 'Failed to approve deposit');
            setProcessingDepositId(null);
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
        setProcessingDepositId(transactionId);
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

    // Format date to a more readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <span>Loading pending deposits...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                <div className="message" style={{ color: '#b91c1c' }}>
                    <span role="img" aria-label="Error">❌</span> Error loading pending deposits
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <h2 className="admin-page-title">Pending Deposits (Admin)</h2>
            
            {error && (
                <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                    <div className="message" style={{ color: '#b91c1c' }}>
                        <span role="img" aria-label="Error">❌</span> {error}
                    </div>
                </div>
            )}

            {rejectingTransactionId && (
                <div className="rejection-form">
                    <h3>Reject Deposit</h3>
                    <p>Please provide a reason for rejecting this deposit:</p>
                    <textarea
                        className="rejection-reason-input"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason"
                        rows={3}
                    />
                    <div className="rejection-buttons">
                        <button
                            className="button danger"
                            onClick={handleConfirmReject}
                            disabled={rejectMutation.isPending || !rejectionReason.trim()}
                        >
                            {rejectMutation.isPending ? (
                                <>
                                    <span className="loading-spinner-small" aria-hidden="true"></span>
                                    <span>Rejecting...</span>
                                </>
                            ) : 'Confirm Rejection'}
                        </button>
                        <button className="button secondary" onClick={handleCancelReject}>Cancel</button>
                    </div>
                </div>
            )}

            {imageUrl && viewingTransactionId && (
                <div className="deposit-image-container">
                    <div className="deposit-image-header">
                        <h3>Deposit Image</h3>
                        <button className="close-btn" onClick={handleCloseImage}>×</button>
                    </div>
                    <div className="deposit-image-wrapper">
                        <img
                            src={imageUrl}
                            alt="Deposit Receipt"
                            className="deposit-image"
                        />
                    </div>
                    <div className="deposit-image-footer">
                        <button className="button" onClick={handleCloseImage}>Close Image</button>
                    </div>
                </div>
            )}

            <div className="transaction-table-container">
                <table className="transaction-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Currency</th>
                            <th>Amount</th>
                            <th>Created At</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingDeposits?.map((transaction) => (
                            <tr key={transaction.id} className="transaction-row">
                                <td>{transaction.type}</td>
                                <td>{transaction.currency}</td>
                                <td className="amount">{transaction.amount}</td>
                                <td className="date">{formatDate(transaction.createdAt)}</td>
                                <td>
                                    <span className="status-badge pending">
                                        {transaction.status}
                                    </span>
                                </td>
                                <td className="actions">
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn approve"
                                            onClick={() => handleApprove(transaction.id)}
                                            disabled={
                                                (approveMutation.isPending && processingDepositId !== null) ||
                                                rejectMutation.isPending
                                            }
                                            title="Approve this deposit"
                                        >
                                            {processingDepositId === transaction.id ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                            className="action-btn reject"
                                            onClick={() => handleReject(transaction.id)}
                                            disabled={
                                                approveMutation.isPending ||
                                                rejectMutation.isPending
                                            }
                                            title="Reject this deposit"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            className="action-btn view"
                                            onClick={() => handleViewImage(transaction.id)}
                                            title="View deposit screenshot"
                                        >
                                            View Image
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!pendingDeposits || pendingDeposits.length === 0) && (
                            <tr>
                                <td colSpan={7} className="no-data">
                                    No pending deposits found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDepositsPage;
