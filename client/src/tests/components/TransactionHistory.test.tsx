import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistory from '../../components/TransactionHistory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock react-query's useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('TransactionHistory', () => {
  // Sample transaction data for testing
  const mockTransactions = [
    {
      id: 'tx1',
      userId: 'user1',
      walletId: 'wallet1',
      type: 'deposit',
      currency: 'USDT',
      amount: '100.00',
      transactionHash: '0x123',
      status: 'completed',
      createdAt: '2023-04-15T10:30:00.000Z',
      updatedAt: '2023-04-15T10:35:00.000Z',
      fileKey: 'receipt1.jpg',
      rejectionReason: null,
    },
    {
      id: 'tx2',
      userId: 'user1',
      walletId: 'wallet1',
      type: 'withdrawal',
      currency: 'USDT',
      amount: '50.00',
      transactionHash: '',
      status: 'pending',
      createdAt: '2023-04-16T14:20:00.000Z',
      updatedAt: '2023-04-16T14:20:00.000Z',
      fileKey: null,
      rejectionReason: null,
      walletAddress: '0xabc',
    },
    {
      id: 'tx3',
      userId: 'user1',
      walletId: 'wallet2',
      type: 'deposit',
      currency: 'JOD',
      amount: '200.00',
      transactionHash: '0x456',
      status: 'rejected',
      createdAt: '2023-04-17T09:15:00.000Z',
      updatedAt: '2023-04-17T09:45:00.000Z',
      fileKey: 'receipt2.jpg',
      rejectionReason: 'Invalid transaction',
    },
  ];

  // Helper function to render the component with QueryClientProvider
  const renderTransactionHistory = (queryResult = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Set up the mock return value for this specific test
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
      ...queryResult,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <TransactionHistory />
      </QueryClientProvider>
    );
  };

  it('displays loading state', () => {
    renderTransactionHistory({ isLoading: true, data: null });
    expect(screen.getByText(/loading transaction history/i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    renderTransactionHistory({ isError: true, data: null });
    expect(screen.getByText(/error loading transaction history/i)).toBeInTheDocument();
  });

  it('displays message when no transactions exist', () => {
    renderTransactionHistory({ data: [] });
    expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
  });

  it('displays all transactions by default', () => {
    renderTransactionHistory();
    
    // Check that all transactions are displayed
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
    expect(screen.getByText('200.00')).toBeInTheDocument();
    
    // Check for different transaction statuses
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/rejected/i)).toBeInTheDocument();
    
    // Check for transaction types
    expect(screen.getAllByText(/deposit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/withdrawal/i).length).toBeGreaterThan(0);
  });

  it('filters transactions by type', async () => {
    renderTransactionHistory();
    const user = userEvent.setup();
    
    // Find and click the deposit filter button
    const depositFilterButton = screen.getByRole('button', { name: /deposits/i });
    await user.click(depositFilterButton);
    
    // Should only show deposit transactions (2)
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('200.00')).toBeInTheDocument();
    expect(screen.queryByText('50.00')).not.toBeInTheDocument();
    
    // Now click the withdrawal filter
    const withdrawalFilterButton = screen.getByRole('button', { name: /withdrawals/i });
    await user.click(withdrawalFilterButton);
    
    // Should only show withdrawal transactions (1)
    expect(screen.queryByText('100.00')).not.toBeInTheDocument();
    expect(screen.queryByText('200.00')).not.toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
    
    // Finally, click the all filter to show all transactions
    const allFilterButton = screen.getByRole('button', { name: /all/i });
    await user.click(allFilterButton);
    
    // All transactions should be visible again
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
    expect(screen.getByText('200.00')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    renderTransactionHistory();
    
    // Check for formatted dates (actual format depends on implementation)
    // This is a simple check for presence of date separators
    const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('displays transaction details correctly', () => {
    renderTransactionHistory();
    
    // Check for specific transaction details
    expect(screen.getByText('USDT')).toBeInTheDocument();
    expect(screen.getByText('JOD')).toBeInTheDocument();
    expect(screen.getByText('0x123')).toBeInTheDocument();
    
    // Check for rejection reason
    expect(screen.getByText('Invalid transaction')).toBeInTheDocument();
  });
}); 