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
        return <div className="loading">Loading transaction history...</div>;
    }

    if (isError) {
        return <div className="alert error">Error loading transaction history</div>;
    }

    if (!transactions || transactions.length === 0) {
        return <div className="alert info">No transaction history found.</div>;
    }

    // Filter transactions based on the selected filter
    const filteredTransactions = filter === 'all' 
        ? transactions 
        : transactions.filter(transaction => transaction.type === filter);

    // Function to format status with color coding
    const formatStatus = (status: string) => {
        switch(status) {
            case 'pending':
                return <span className="status warning">Pending</span>;
            case 'approved':
                return <span className="status success">Approved</span>;
            case 'rejected':
                return <span className="status error">Rejected</span>;
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <div>
            <div className="transaction-filter">
                <h3>Transaction History</h3>
                <div className="filter-buttons">
                    <button 
                        className={`button text ${filter === 'all' ? 'active' : ''}`} 
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`button text ${filter === 'deposit' ? 'active' : ''}`} 
                        onClick={() => setFilter('deposit')}
                    >
                        Deposits
                    </button>
                    <button 
                        className={`button text ${filter === 'withdrawal' ? 'active' : ''}`} 
                        onClick={() => setFilter('withdrawal')}
                    >
                        Withdrawals
                    </button>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="alert info">No {filter} transactions found.</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Currency</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>{formatDate(transaction.createdAt)}</td>
                                <td>
                                    {transaction.type === 'deposit' ? (
                                        <span className="status success pill">Deposit</span>
                                    ) : (
                                        <span className="status info pill">Withdrawal</span>
                                    )}
                                </td>
                                <td>{transaction.currency}</td>
                                <td>{transaction.amount}</td>
                                <td>{formatStatus(transaction.status)}</td>
                                <td>
                                    {transaction.status === 'rejected'
                                        ? transaction.rejectionReason
                                        : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default TransactionHistory;
