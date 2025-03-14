import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSocketStore, SocketEvents, TransactionUpdateData } from '../../lib/socketService';
import { toast } from 'react-toastify';

// Import our Joy UI components
import { 
  Typography, 
  Button, 
  Alert, 
  Chip,
  Box,
  Tabs,
  Table,
  TableColumn
} from './index';

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

function TransactionHistoryJoy() {
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

  // Filter transactions based on the selected filter
  const filteredTransactions = !transactions ? [] : (
    filter === 'all' 
      ? transactions 
      : transactions.filter(transaction => transaction.type === filter)
  );

  // Define table columns
  const columns: TableColumn<Transaction>[] = [
    { 
      header: 'Date', 
      accessor: (transaction) => formatDate(transaction.createdAt) 
    },
    { 
      header: 'Type', 
      accessor: (transaction) => (
        transaction.type === 'deposit' ? (
          <Chip color="success" size="sm">Deposit</Chip>
        ) : (
          <Chip color="primary" size="sm">Withdrawal</Chip>
        )
      ),
      align: 'center'
    },
    { header: 'Currency', accessor: 'currency' },
    { header: 'Amount', accessor: 'amount' },
    { 
      header: 'Status', 
      accessor: (transaction) => {
        switch(transaction.status) {
          case 'pending':
            return <Chip color="warning" variant="soft">Pending</Chip>;
          case 'approved':
            return <Chip color="success" variant="soft">Approved</Chip>;
          case 'rejected':
            return <Chip color="danger" variant="soft">Rejected</Chip>;
          default:
            return <span>{transaction.status}</span>;
        }
      },
      align: 'center' 
    },
    { 
      header: 'Notes', 
      accessor: (transaction) => (
        transaction.status === 'rejected' && transaction.rejectionReason
          ? transaction.rejectionReason
          : '-'
      ) 
    },
  ];

  // Tab items for the filter
  const tabItems = [
    {
      label: 'All Transactions',
      value: 'all',
      content: (
        filteredTransactions.length === 0 ? (
          <Alert color="primary" sx={{ mt: 2 }}>No transactions found.</Alert>
        ) : (
          <Table
            columns={columns}
            data={filteredTransactions}
            borderAxis="x"
            hoverRow
            stripe="odd"
            size="md"
            stickyHeader
          />
        )
      )
    },
    {
      label: 'Deposits',
      value: 'deposit',
      content: (
        !transactions || transactions.filter(t => t.type === 'deposit').length === 0 ? (
          <Alert color="primary" sx={{ mt: 2 }}>No deposits found.</Alert>
        ) : (
          <Table
            columns={columns}
            data={transactions.filter(t => t.type === 'deposit')}
            borderAxis="x"
            hoverRow
            stripe="odd"
            size="md"
            stickyHeader
          />
        )
      )
    },
    {
      label: 'Withdrawals',
      value: 'withdrawal',
      content: (
        !transactions || transactions.filter(t => t.type === 'withdrawal').length === 0 ? (
          <Alert color="primary" sx={{ mt: 2 }}>No withdrawals found.</Alert>
        ) : (
          <Table
            columns={columns}
            data={transactions.filter(t => t.type === 'withdrawal')}
            borderAxis="x"
            hoverRow
            stripe="odd"
            size="md"
            stickyHeader
          />
        )
      )
    }
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading transaction history...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert color="danger" sx={{ my: 2 }}>
        Error loading transaction history
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h3">Transaction History</Typography>
      </Box>

      <Tabs 
        tabs={tabItems}
        onChange={(value) => setFilter(value as 'all' | 'deposit' | 'withdrawal')}
        value={filter}
      />
    </Box>
  );
}

export default TransactionHistoryJoy; 