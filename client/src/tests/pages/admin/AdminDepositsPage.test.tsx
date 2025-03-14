import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import AdminDepositsPage from '../../../pages/admin/AdminDepositsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('AdminDepositsPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock successful deposits fetch
    const mockDeposits = [
      {
        id: '1',
        userId: 'user1',
        walletId: 'wallet1',
        type: 'deposit',
        currency: 'USDT',
        amount: '100',
        transactionHash: '0x123',
        status: 'pending',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        fileKey: 'file1.jpg',
      },
      {
        id: '2',
        userId: 'user2',
        walletId: 'wallet2',
        type: 'deposit',
        currency: 'USDT',
        amount: '200',
        transactionHash: '0x456',
        status: 'pending',
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        fileKey: 'file2.jpg',
      },
    ];

    // Mock user info
    const mockUsers = {
      user1: { email: 'user1@example.com' },
      user2: { email: 'user2@example.com' },
    };

    // Mock image URLs
    const mockImageUrls = {
      'file1.jpg': 'https://example.com/file1.jpg',
      'file2.jpg': 'https://example.com/file2.jpg',
    };

    mockFetch.mockImplementation((url) => {
      if (url === '/api/admin/deposits') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ deposits: mockDeposits }),
        });
      }
      if (url.includes('/api/admin/user/')) {
        const userId = url.split('/').pop();
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUsers[userId as keyof typeof mockUsers] }),
        });
      }
      if (url.includes('/api/file/')) {
        const fileKey = url.split('/').pop();
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: mockImageUrls[fileKey as keyof typeof mockImageUrls] }),
        });
      }
      if (url.includes('/api/admin/deposit/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Deposit updated successfully' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders the deposits page with pending deposits', async () => {
    renderWithQueryClient(<AdminDepositsPage />);
    
    // Check page title
    expect(screen.getByText('Manage Deposits')).toBeInTheDocument();
    
    // Wait for deposits to load
    await waitFor(() => {
      expect(screen.getByText('100 USDT')).toBeInTheDocument();
      expect(screen.getByText('200 USDT')).toBeInTheDocument();
    });
    
    // Check transaction hashes are displayed
    expect(screen.getByText('0x123')).toBeInTheDocument();
    expect(screen.getByText('0x456')).toBeInTheDocument();
    
    // Check status badges
    const pendingBadges = screen.getAllByText('PENDING');
    expect(pendingBadges.length).toBe(2);
  });

  it('allows approving a pending deposit', async () => {
    renderWithQueryClient(<AdminDepositsPage />);
    
    // Wait for deposits to load
    await waitFor(() => {
      expect(screen.getByText('100 USDT')).toBeInTheDocument();
    });
    
    // Find the first deposit's approve button and click it
    const approveButtons = screen.getAllByText('Approve');
    fireEvent.click(approveButtons[0]);
    
    // Confirmation dialog should appear
    expect(screen.getByText('Are you sure you want to approve this deposit?')).toBeInTheDocument();
    
    // Confirm the approval
    fireEvent.click(screen.getByText('Yes, Approve'));
    
    // Check that the API was called correctly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/deposit/1/approve', expect.anything());
    });
  });

  it('allows rejecting a pending deposit with a reason', async () => {
    renderWithQueryClient(<AdminDepositsPage />);
    
    // Wait for deposits to load
    await waitFor(() => {
      expect(screen.getByText('100 USDT')).toBeInTheDocument();
    });
    
    // Find the first deposit's reject button and click it
    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    
    // Rejection dialog should appear
    expect(screen.getByText('Enter a reason for rejection:')).toBeInTheDocument();
    
    // Enter a reason
    const reasonInput = screen.getByPlaceholderText('Reason for rejection');
    fireEvent.change(reasonInput, { target: { value: 'Invalid transaction' } });
    
    // Confirm the rejection
    fireEvent.click(screen.getByText('Reject Deposit'));
    
    // Check that the API was called correctly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/deposit/1/reject', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Invalid transaction'),
      }));
    });
  });

  it('shows user email for each deposit', async () => {
    renderWithQueryClient(<AdminDepositsPage />);
    
    // Wait for user emails to load
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('allows viewing receipt/proof image', async () => {
    renderWithQueryClient(<AdminDepositsPage />);
    
    // Wait for deposits to load
    await waitFor(() => {
      expect(screen.getByText('100 USDT')).toBeInTheDocument();
    });
    
    // Find the view receipt buttons and click the first one
    const viewButtons = screen.getAllByText('View Receipt');
    fireEvent.click(viewButtons[0]);
    
    // Image modal should open
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // Image should be rendered
      const image = screen.getByAltText('Transaction Receipt');
      expect(image).toBeInTheDocument();
      expect(image.getAttribute('src')).toBe('https://example.com/file1.jpg');
    });
  });
}); 