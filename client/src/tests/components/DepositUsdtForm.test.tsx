import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import DepositUsdtForm from '../../components/DepositUsdtForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DepositUsdtForm Component', () => {
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
    
    // Mock upload presigned URL endpoint
    mockFetch.mockImplementation((url) => {
      if (url === '/api/upload/presigned-url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            presignedUrl: 'https://example.com/upload',
            fileKey: 'test-file-key'
          }),
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

  it('renders the deposit form correctly', () => {
    renderWithQueryClient(<DepositUsdtForm />);
    
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction hash/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/receipt\/proof/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deposit/i })).toBeInTheDocument();
  });

  it('validates form fields on submission', async () => {
    renderWithQueryClient(<DepositUsdtForm />);
    
    // Submit form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /deposit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
  });

  it('handles successful deposit submission', async () => {
    // Mock successful deposit response
    mockFetch.mockImplementation((url) => {
      if (url === '/api/upload/presigned-url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            presignedUrl: 'https://example.com/upload',
            fileKey: 'test-file-key'
          }),
        });
      }
      if (url === '/api/deposit/usdt') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            message: 'Deposit submitted successfully and is pending approval' 
          }),
        });
      }
      if (url.includes('https://example.com/upload')) {
        return Promise.resolve({
          ok: true,
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithQueryClient(<DepositUsdtForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/transaction hash/i), { target: { value: '0x123456789abcdef' } });
    
    // Mock file upload
    const file = new File(['test content'], 'receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/receipt\/proof/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    
    fireEvent.change(fileInput);
    
    // Wait for file upload to process
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/upload/presigned-url', expect.anything());
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /deposit/i }));
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Deposit submitted successfully and is pending approval')).toBeInTheDocument();
    });
  });

  it('displays an error message when deposit fails', async () => {
    // Mock failed deposit response
    mockFetch.mockImplementation((url) => {
      if (url === '/api/upload/presigned-url') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            presignedUrl: 'https://example.com/upload',
            fileKey: 'test-file-key'
          }),
        });
      }
      if (url === '/api/deposit/usdt') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid transaction hash' }),
        });
      }
      if (url.includes('https://example.com/upload')) {
        return Promise.resolve({
          ok: true,
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithQueryClient(<DepositUsdtForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/transaction hash/i), { target: { value: '0x123456789abcdef' } });
    
    // Mock file upload
    const file = new File(['test content'], 'receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/receipt\/proof/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    
    fireEvent.change(fileInput);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /deposit/i }));
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Invalid transaction hash')).toBeInTheDocument();
    });
  });
}); 