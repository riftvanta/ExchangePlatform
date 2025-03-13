import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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

function AdminWithdrawalsPage() {
    const [error, setError] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingTransactionId, setRejectingTransactionId] = useState<
        string | null
    >(null);

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

    const approveMutation = useMutation({
        mutationFn: async (transactionId: string) => {
            const response = await fetch(
                `/api/admin/withdrawals/${transactionId}/approve`,
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
            setError(null);
        },
        onError: (err: any) => {
            setError(err.message || 'Failed to approve withdrawal');
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
                `/api/admin/withdrawals/${transactionId}/reject`,
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
            setError(null);
        },
        onError: (err: any) => {
            setError(err.message || 'Failed to reject withdrawal');
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

    if (isLoading) {
        return <div>Loading pending withdrawals...</div>;
    }

    if (isError) {
        return <div>Error loading pending withdrawals</div>;
    }

    // Group withdrawals by user
    const withdrawalsByUser = pendingWithdrawals?.reduce((acc, withdrawal) => {
        if (!acc[withdrawal.userId]) {
            acc[withdrawal.userId] = [];
        }
        acc[withdrawal.userId].push(withdrawal);
        return acc;
    }, {} as Record<string, EnhancedWithdrawal[]>);

    return (
        <div>
            <h2>Pending Withdrawals (Admin)</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {rejectingTransactionId && (
                <div className="rejection-form" style={{ 
                    marginBottom: '20px',
                    padding: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <p>
                        <strong>Reason for rejecting withdrawal:</strong>
                    </p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        style={{ width: '100%', minHeight: '80px' }}
                        placeholder="Provide a reason for rejection..."
                    />
                    <div style={{ marginTop: '10px' }}>
                        <button
                            onClick={handleConfirmReject}
                            disabled={rejectMutation.isPending || !rejectionReason.trim()}
                            style={{ marginRight: '10px' }}
                        >
                            {rejectMutation.isPending
                                ? 'Rejecting...'
                                : 'Confirm Rejection'}
                        </button>
                        <button onClick={handleCancelReject}>Cancel</button>
                    </div>
                </div>
            )}

            {!pendingWithdrawals || pendingWithdrawals.length === 0 ? (
                <p>No pending withdrawals to review.</p>
            ) : (
                Object.entries(withdrawalsByUser || {}).map(([userId, userWithdrawals]) => (
                    <div key={userId} className="user-withdrawals" style={{ 
                        marginBottom: '30px',
                        border: '1px solid #eee',
                        borderRadius: '5px',
                        padding: '15px'
                    }}>
                        <h3>User ID: {userId}</h3>
                        
                        {/* User balance info */}
                        <div className="balance-info" style={{ 
                            backgroundColor: '#f3f3f3',
                            padding: '10px',
                            marginBottom: '15px',
                            borderRadius: '5px'
                        }}>
                            <p>
                                <strong>Current Balance:</strong> {userWithdrawals[0].currentBalance} USDT
                            </p>
                            <p>
                                <strong>Available Balance (after all pending):</strong> {userWithdrawals[0].availableBalance} USDT
                            </p>
                            <p style={{ fontSize: '0.9em', color: '#666' }}>
                                Note: Withdrawals are processed in chronological order. Some withdrawals may be 
                                disabled if approving earlier withdrawals would make funds insufficient.
                            </p>
                        </div>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Request Date</th>
                                    <th>Amount (USDT)</th>
                                    <th>Destination Address</th>
                                    <th>Can Approve?</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userWithdrawals.map((withdrawal) => (
                                    <tr key={withdrawal.id} style={{ 
                                        backgroundColor: withdrawal.canApprove ? 'transparent' : '#fff0f0'
                                    }}>
                                        <td>{new Date(withdrawal.createdAt).toLocaleString()}</td>
                                        <td>{withdrawal.amount}</td>
                                        <td style={{ wordBreak: 'break-all' }}>
                                            {withdrawal.walletAddress}
                                        </td>
                                        <td>
                                            {withdrawal.canApprove ? (
                                                <span style={{ color: 'green' }}>Yes</span>
                                            ) : (
                                                <span style={{ color: 'red' }}>No - Insufficient Balance</span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleApprove(withdrawal.id)}
                                                disabled={
                                                    approveMutation.isPending ||
                                                    rejectMutation.isPending ||
                                                    !withdrawal.canApprove
                                                }
                                                style={{ marginRight: '10px' }}
                                            >
                                                {approveMutation.isPending ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(withdrawal.id)}
                                                disabled={
                                                    approveMutation.isPending ||
                                                    rejectMutation.isPending
                                                }
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}
        </div>
    );
}

export default AdminWithdrawalsPage; 