import { useQuery } from '@tanstack/react-query';

interface Withdrawal {
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
    rejectionReason: string | null;
}

function WithdrawalHistory() {
    const {
        data: withdrawals,
        isLoading,
        isError,
    } = useQuery<Withdrawal[], Error>({
        queryKey: ['withdrawals'],
        queryFn: async () => {
            const response = await fetch('/api/withdrawals');
            if (!response.ok) {
                throw new Error('Failed to fetch withdrawal history');
            }
            const data = await response.json();
            return data.withdrawals;
        },
    });

    if (isLoading) {
        return <div className="loading">Loading withdrawal history...</div>;
    }

    if (isError) {
        return <div className="alert error">Error loading withdrawal history</div>;
    }

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

    // Check if there are any withdrawals
    if (!withdrawals || withdrawals.length === 0) {
        return <div className="alert info">No withdrawal history found.</div>;
    }

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount (USDT)</th>
                        <th>Destination Address</th>
                        <th>Status</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                            <td>
                                {new Date(
                                    withdrawal.createdAt
                                ).toLocaleString()}
                            </td>
                            <td>{withdrawal.amount}</td>
                            <td style={{ wordBreak: 'break-all' }}>
                                {withdrawal.walletAddress}
                            </td>
                            <td>{formatStatus(withdrawal.status)}</td>
                            <td>
                                {withdrawal.status === 'rejected'
                                    ? withdrawal.rejectionReason
                                    : ''}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default WithdrawalHistory; 