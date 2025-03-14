import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test-utils';
import WalletBalances from '../../components/WalletBalances';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WalletBalances Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('shows loading state while fetching wallets', async () => {
    // Mock a pending fetch response
    mockFetch.mockReturnValue(new Promise(() => {}));

    renderWithQueryClient(<WalletBalances />);
    
    expect(screen.getByText('Loading wallets...')).toBeInTheDocument();
  });

  it('displays an error message when fetch fails', async () => {
    // Mock a failed fetch response
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    renderWithQueryClient(<WalletBalances />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading wallets')).toBeInTheDocument();
    });
  });

  it('displays a message when no wallets are found', async () => {
    // Mock a successful fetch with empty wallets
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: [] }),
    });

    renderWithQueryClient(<WalletBalances />);
    
    await waitFor(() => {
      expect(screen.getByText('No wallets found. Create a wallet to get started.')).toBeInTheDocument();
    });
  });

  it('displays wallets when they exist', async () => {
    // Mock a successful fetch with wallets
    const mockWallets = [
      {
        id: '1',
        userId: 'user1',
        currency: 'USDT',
        balance: '100',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
      {
        id: '2',
        userId: 'user1',
        currency: 'JOD',
        balance: '50',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: mockWallets }),
    });

    renderWithQueryClient(<WalletBalances />);
    
    await waitFor(() => {
      expect(screen.getByText('USDT')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('JOD')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });
}); 