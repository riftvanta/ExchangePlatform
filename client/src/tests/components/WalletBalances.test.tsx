import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WalletBalances from '../../components/WalletBalances';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock react-query's useQuery hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe('WalletBalances', () => {
  // Set up mock for useQuery before each test
  beforeEach(() => {
    const useQueryMock = vi.fn();
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockImplementation(useQueryMock);
  });

  // Helper function to render the component with QueryClientProvider
  const renderWalletBalances = (queryResult = {}) => {
    const queryClient = new QueryClient();
    
    // Set up the mock return value for this specific test
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockImplementation(() => ({
      isLoading: false,
      isError: false,
      data: [],
      ...queryResult,
    }));
    
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletBalances />
      </QueryClientProvider>
    );
  };

  it('displays loading state', () => {
    renderWalletBalances({ isLoading: true });
    expect(screen.getByText(/loading wallets.../i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    renderWalletBalances({ isError: true });
    expect(screen.getByText(/error loading wallets/i)).toBeInTheDocument();
  });

  it('displays message when no wallets exist', () => {
    renderWalletBalances({ data: [] });
    expect(screen.getByText(/no wallets found/i)).toBeInTheDocument();
  });

  it('displays wallet balances correctly', () => {
    // Mock wallet data
    const mockWallets = [
      {
        id: '1',
        userId: 'user1',
        currency: 'USDT',
        balance: '1000.50',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
      {
        id: '2',
        userId: 'user1',
        currency: 'JOD',
        balance: '500.75',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    ];

    renderWalletBalances({ data: mockWallets });
    
    // Check that all wallets are displayed
    expect(screen.getByText('USDT')).toBeInTheDocument();
    expect(screen.getByText('1000.50')).toBeInTheDocument();
    expect(screen.getByText('JOD')).toBeInTheDocument();
    expect(screen.getByText('500.75')).toBeInTheDocument();
  });
}); 