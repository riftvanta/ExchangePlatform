import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSocketStore, SocketEvents, TransactionUpdateData } from '../lib/socketService';
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
    rejectionReason: string | null;
    walletAddress?: string; // Optional field for withdrawal transactions
}

function TransactionHistory() {
    const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
    const queryClient = useQueryClient();
    const socket = useSocketStore((state) => state.socket);

    const {
        data: transactions,
        isLoading,
        isError,
    } = useQuery<Transaction[], Error>({
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

    // Subscribe to real-time transaction updates
    useEffect(() => {
        if (!socket) return;
        
        // Handle transaction status updates
        const handleTransactionUpdate = (data: TransactionUpdateData) => {
            console.log('Transaction update received:', data);
            
            // Show toast notification
            let message = '';
            if (data.status === 'approved') {
                message = `Your ${data.type} of ${data.amount} ${data.currency} has been approved!`;
                toast.success(message);
            } else if (data.status === 'rejected') {
                message = `Your ${data.type} of ${data.amount} ${data.currency} has been rejected. Reason: ${data.rejectionReason || 'No reason provided.'}`;
                toast.error(message);
            }
            
            // Invalidate the transactions query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        };
        
        // Listen for transaction updates
        socket.on(SocketEvents.TRANSACTION_UPDATE, handleTransactionUpdate);
        
        // Clean up on unmount
        return () => {
            socket.off(SocketEvents.TRANSACTION_UPDATE, handleTransactionUpdate);
        };
    }, [socket, queryClient]);
    
    // Subscribe to real-time deposit updates
    useEffect(() => {
        if (!socket) return;
        
        // Handle deposit updates
        const handleDepositUpdate = (data: any) => {
            console.log('Deposit update received:', data);
            
            // Show toast notification
            toast.info(`New deposit of ${data.amount} ${data.currency} detected and is awaiting approval.`);
            
            // Invalidate the transactions query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        };
        
        // Listen for deposit updates
        socket.on(SocketEvents.DEPOSIT_UPDATE, handleDepositUpdate);
        
        // Clean up on unmount
        return () => {
            socket.off(SocketEvents.DEPOSIT_UPDATE, handleDepositUpdate);
        };
    }, [socket, queryClient]);

    // Function to format date in MM/DD/YYYY, HH:MM format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${month}/${day}/${year}, ${hours}:${minutes}`;
    };

    if (isLoading) {
        return (
            <div className="transaction-history-loading" role="status" aria-label="Loading transaction history">
                <div className="loading-spinner"></div>
                <span className="sr-only">Loading transaction history...</span>
                <p className="loading-text">Loading your transaction history...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                <div className="message" style={{ color: '#b91c1c' }}>
                    <span role="img" aria-label="Error">❌</span> Error loading transaction history
                </div>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="verification-banner" style={{ backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }} role="alert">
                <div className="message" style={{ color: '#0c4a6e' }}>
                    <span role="img" aria-label="Information">ℹ️</span> No transaction history found.
                </div>
            </div>
        );
    }

    // Filter transactions based on the selected filter
    const filteredTransactions = filter === 'all' 
        ? transactions 
        : transactions.filter(transaction => transaction.type === filter);

    // Function to determine status badge styling
    const formatStatus = (status: string) => {
        switch(status) {
            case 'pending':
                return (
                    <span className="status-badge pending" role="status">
                        <span role="img" aria-hidden="true">⏳</span> Pending
                    </span>
                );
            case 'approved':
                return (
                    <span className="status-badge success" role="status">
                        <span role="img" aria-hidden="true">✅</span> Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="status-badge error" role="status">
                        <span role="img" aria-hidden="true">❌</span> Rejected
                    </span>
                );
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <div className="transaction-history-container">
            <div className="transaction-header">
                <h3>Transaction History</h3>
                <div className="filter-buttons" role="tablist" aria-label="Filter transactions">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                        role="tab"
                        aria-selected={filter === 'all'}
                        aria-controls="all-transactions-tab"
                    >
                        All
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'deposit' ? 'active' : ''}`}
                        onClick={() => setFilter('deposit')}
                        role="tab"
                        aria-selected={filter === 'deposit'}
                        aria-controls="deposit-transactions-tab"
                    >
                        Deposits
                    </button>
                    <button 
                        className={`filter-btn ${filter === 'withdrawal' ? 'active' : ''}`}
                        onClick={() => setFilter('withdrawal')}
                        role="tab"
                        aria-selected={filter === 'withdrawal'}
                        aria-controls="withdrawal-transactions-tab"
                    >
                        Withdrawals
                    </button>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="verification-banner" style={{ backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }} role="alert">
                    <div className="message" style={{ color: '#0c4a6e' }}>
                        <span role="img" aria-label="Information">ℹ️</span> No {filter} transactions found.
                    </div>
                </div>
            ) : (
                <div className="transaction-table-container" role="region" aria-label="Transaction history" id={`${filter}-transactions-tab`}>
                    <table className="transaction-table">
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Type</th>
                                <th scope="col">Currency</th>
                                <th scope="col">Amount</th>
                                <th scope="col">Status</th>
                                <th scope="col">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className={`transaction-row ${transaction.status}`}>
                                    <td>{formatDate(transaction.createdAt)}</td>
                                    <td>
                                        {transaction.type === 'deposit' ? (
                                            <span className="transaction-type deposit" aria-label="Deposit transaction">
                                                <span role="img" aria-hidden="true">↓</span> Deposit
                                            </span>
                                        ) : (
                                            <span className="transaction-type withdrawal" aria-label="Withdrawal transaction">
                                                <span role="img" aria-hidden="true">↑</span> Withdrawal
                                            </span>
                                        )}
                                    </td>
                                    <td>{transaction.currency}</td>
                                    <td className="amount">
                                        <span className={transaction.type === 'deposit' ? 'amount-positive' : 'amount-negative'}>
                                            {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount}
                                        </span>
                                    </td>
                                    <td>{formatStatus(transaction.status)}</td>
                                    <td>
                                        {transaction.status === 'rejected' && transaction.rejectionReason ? (
                                            <span className="rejection-reason" title={transaction.rejectionReason}>
                                                {transaction.rejectionReason}
                                            </span>
                                        ) : (
                                            <span className="no-notes">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default TransactionHistory;
