import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSocketStore, SocketEvents, TransactionUpdateData } from '../../lib/socketService';
import { toast } from 'react-toastify';

interface EnhancedWithdrawal {
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
    walletAddress: string;
    currentBalance: string;
    availableBalance: string;
    canApprove: boolean;
    rejectionReason?: string | null;
}

type WithdrawalsByUser = Record<string, EnhancedWithdrawal[]>;

function AdminWithdrawalsPage() {
    const [error, setError] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<string | null>(null);
    const socket = useSocketStore(state => state.socket);

    const {
        data: pendingWithdrawals,
        isLoading,
        isError,
    } = useQuery<EnhancedWithdrawal[], Error>({
        queryKey: ['admin', 'withdrawals'],
        queryFn: async () => {
            const response = await fetch('/api/admin/withdrawals');
            if (!response.ok) {
                throw new Error('Failed to fetch pending withdrawals');
            }
            const data = await response.json();
            return data.withdrawals;
        },
    });

    const queryClient = useQueryClient();

    // Group withdrawals by user
    const withdrawalsByUser: WithdrawalsByUser = pendingWithdrawals ? 
        pendingWithdrawals.reduce((grouped, withdrawal) => {
            if (!grouped[withdrawal.userId]) {
                grouped[withdrawal.userId] = [];
            }
            grouped[withdrawal.userId].push(withdrawal);
            return grouped;
        }, {} as WithdrawalsByUser) : {};

    // Subscribe to real-time new pending transaction notifications
    useEffect(() => {
        if (!socket) return;
        
        // Handle new pending transaction notification
        const handleNewPendingTransaction = (data: TransactionUpdateData) => {
            console.log('New pending transaction received:', data);
            
            // Only show notification for withdrawals
            if (data.type === 'withdrawal') {
                // Show toast notification
                toast.info(`New pending withdrawal of ${data.amount} ${data.currency} received!`, {
                    onClick: () => {
                        // Refresh the data when clicking on the notification
                        queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
                        window.scrollTo(0, 0); // Scroll to top to see the new withdrawal
                    }
                });
                
                // Refresh the data automatically
                queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
            }
        };
        
        // Listen for new pending transactions
        socket.on(SocketEvents.NEW_PENDING_TRANSACTION, handleNewPendingTransaction);
        
        // Clean up on unmount
        return () => {
            socket.off(SocketEvents.NEW_PENDING_TRANSACTION, handleNewPendingTransaction);
        };
    }, [socket, queryClient]);

    const approveMutation = useMutation({
        mutationFn: async (withdrawalId: string) => {
            const response = await fetch(
                `/api/admin/withdrawals/${withdrawalId}/approve`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to approve withdrawal');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
            toast.success('Withdrawal approved successfully');
            setError(null);
        },
        onError: (err: any) => {
            setError(err.message || 'Failed to approve withdrawal');
            toast.error(err.message || 'Failed to approve withdrawal');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({
            withdrawalId,
            rejectionReason,
        }: {
            withdrawalId: string;
            rejectionReason: string;
        }) => {
            const response = await fetch(
                `/api/admin/withdrawals/${withdrawalId}/reject`,
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
                throw new Error(errorData.error || 'Failed to reject withdrawal');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
            toast.success('Withdrawal rejected successfully');
            setError(null);
        },
        onError: (err: any) => {
            setError(err.message || 'Failed to reject withdrawal');
            toast.error(err.message || 'Failed to reject withdrawal');
        },
    });

    const handleApprove = (withdrawalId: string) => {
        approveMutation.mutate(withdrawalId);
    };

    const handleReject = (withdrawalId: string) => {
        setRejectingWithdrawalId(withdrawalId);
        setRejectionReason('');
        setError(null);
    };

    const handleConfirmReject = async () => {
        if (rejectingWithdrawalId) {
            try {
                await rejectMutation.mutateAsync({
                    withdrawalId: rejectingWithdrawalId,
                    rejectionReason,
                });
            } finally {
                setRejectingWithdrawalId(null);
                setRejectionReason('');
            }
        }
    };

    const handleCancelReject = () => {
        setRejectingWithdrawalId(null);
        setRejectionReason('');
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
                <span>Loading pending withdrawals...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                <div className="message" style={{ color: '#b91c1c' }}>
                    <span role="img" aria-label="Error">❌</span> Error loading pending withdrawals
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <h2 className="admin-page-title">Pending Withdrawals (Admin)</h2>

            {error && (
                <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                    <div className="message" style={{ color: '#b91c1c' }}>
                        <span role="img" aria-label="Error">❌</span> {error}
                    </div>
                </div>
            )}

            {rejectingWithdrawalId && (
                <div className="rejection-form">
                    <h3>Reject Withdrawal</h3>
                    <p>Please provide a reason for rejecting this withdrawal:</p>
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

            {!pendingWithdrawals || pendingWithdrawals.length === 0 ? (
                <div className="verification-banner" style={{ backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }} role="alert">
                    <div className="message" style={{ color: '#0c4a6e' }}>
                        <span role="img" aria-label="Information">ℹ️</span> No pending withdrawals to review.
                    </div>
                </div>
            ) : (
                Object.entries(withdrawalsByUser || {}).map(([userId, userWithdrawals]) => (
                    <div key={userId} className="user-withdrawals-section">
                        <h3 className="user-id-heading">User ID: {userId}</h3>
                        
                        {/* User balance info */}
                        <div className="balance-info-card">
                            <div className="balance-info-item">
                                <span className="balance-label">Current Balance:</span>
                                <span className="balance-value">{userWithdrawals[0].currentBalance} USDT</span>
                            </div>
                            <div className="balance-info-item">
                                <span className="balance-label">Available Balance (after all pending):</span>
                                <span className="balance-value">{userWithdrawals[0].availableBalance} USDT</span>
                            </div>
                            <div className="balance-info-note">
                                <span role="img" aria-label="Note">ℹ️</span> Withdrawals are processed in chronological order. Some withdrawals may be 
                                disabled if approving earlier withdrawals would make funds insufficient.
                            </div>
                        </div>
                        
                        <div className="transaction-table-container">
                            <table className="transaction-table">
                                <thead>
                                    <tr>
                                        <th>Request Date</th>
                                        <th>Amount</th>
                                        <th>Destination Address</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userWithdrawals.map((withdrawal) => (
                                        <tr key={withdrawal.id} className={`transaction-row ${withdrawal.canApprove ? '' : 'insufficient'}`}>
                                            <td className="date">{formatDate(withdrawal.createdAt)}</td>
                                            <td className="amount">{withdrawal.amount} USDT</td>
                                            <td className="wallet-address-cell">
                                                <div className="wallet-address-container">
                                                    {withdrawal.walletAddress}
                                                </div>
                                            </td>
                                            <td>
                                                {withdrawal.canApprove ? (
                                                    <span className="status-badge success">Available</span>
                                                ) : (
                                                    <span className="status-badge error">Insufficient Balance</span>
                                                )}
                                            </td>
                                            <td className="actions">
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn approve"
                                                        onClick={() => handleApprove(withdrawal.id)}
                                                        disabled={
                                                            approveMutation.isPending ||
                                                            rejectMutation.isPending ||
                                                            !withdrawal.canApprove
                                                        }
                                                        title={withdrawal.canApprove ? "Approve this withdrawal" : "Cannot approve - insufficient balance"}
                                                    >
                                                        {approveMutation.isPending ? 'Processing...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="action-btn reject"
                                                        onClick={() => handleReject(withdrawal.id)}
                                                        disabled={
                                                            approveMutation.isPending ||
                                                            rejectMutation.isPending
                                                        }
                                                        title="Reject this withdrawal"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default AdminWithdrawalsPage; 