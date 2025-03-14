import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DepositUsdtForm from '../../components/DepositUsdtForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useMutation and useQueryClient hooks
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

// Mock fetch for file upload
global.fetch = vi.fn();

describe('DepositUsdtForm', () => {
  const mockMutateAsync = vi.fn();
  const mockInvalidateQueries = vi.fn();
  let queryClient: QueryClient;
  
  // Create a fake file for testing
  const createTestFile = () => {
    return new File(['test content'], 'screenshot.png', { type: 'image/png' });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock implementation for fetch (file upload)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ key: 'uploaded-file-key-123' }),
    });
    
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  // Helper function to render the component with QueryClientProvider
  const renderDepositUsdtForm = (mutationState = {}) => {
    // Mock implementation for useQueryClient
    const { useQueryClient } = require('@tanstack/react-query');
    useQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
    
    // Mock implementation for useMutation
    const { useMutation } = require('@tanstack/react-query');
    useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      ...mutationState,
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <DepositUsdtForm />
      </QueryClientProvider>
    );
  };

  it('renders the deposit form correctly', () => {
    renderDepositUsdtForm();
    
    // Check for form elements
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction hash/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/screenshot/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deposit/i })).toBeInTheDocument();
  });

  it('allows entering amount and transaction hash', async () => {
    renderDepositUsdtForm();
    const user = userEvent.setup();
    
    const amountInput = screen.getByLabelText(/amount/i);
    const hashInput = screen.getByLabelText(/transaction hash/i);
    
    await user.type(amountInput, '100.50');
    await user.type(hashInput, '0x123abc456def');
    
    expect(amountInput).toHaveValue('100.50');
    expect(hashInput).toHaveValue('0x123abc456def');
  });

  it('validates input fields', async () => {
    renderDepositUsdtForm();
    const user = userEvent.setup();
    
    // Try to submit without filling in required fields
    const submitButton = screen.getByRole('button', { name: /deposit/i });
    await user.click(submitButton);
    
    // Should not submit the form - error message should appear
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    renderDepositUsdtForm();
    const user = userEvent.setup();
    
    // Create a test file
    const file = createTestFile();
    
    // Get the file input
    const fileInput = screen.getByLabelText(/screenshot/i);
    
    // Upload the file
    await user.upload(fileInput, file);
    
    // Verify file upload was triggered
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('submits the form with valid data', async () => {
    // Mock successful mutation
    mockMutateAsync.mockResolvedValueOnce({ message: 'Deposit request submitted successfully' });
    
    renderDepositUsdtForm();
    const user = userEvent.setup();
    
    // Fill in the form
    await user.type(screen.getByLabelText(/amount/i), '100.50');
    await user.type(screen.getByLabelText(/transaction hash/i), '0x123abc456def');
    
    // Mock file upload
    const file = createTestFile();
    await user.upload(screen.getByLabelText(/screenshot/i), file);
    
    // Wait for file upload to complete (mocked)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /deposit/i }));
    
    // Verify mutation was called with correct data
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        amount: '100.50',
        transactionHash: '0x123abc456def',
        fileKey: 'uploaded-file-key-123',
      });
    });
  });

  it('shows loading state during form submission', () => {
    // Mock loading state
    renderDepositUsdtForm({ isLoading: true });
    
    // Check loading state
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
  });

  it('displays success message after successful deposit', async () => {
    // Mock successful mutation
    mockMutateAsync.mockResolvedValueOnce({ message: 'Deposit request submitted successfully' });
    
    renderDepositUsdtForm();
    const user = userEvent.setup();
    
    // Fill in the form and submit
    await user.type(screen.getByLabelText(/amount/i), '100.50');
    await user.type(screen.getByLabelText(/transaction hash/i), '0x123abc456def');
    
    // Mock file upload
    const file = createTestFile();
    await user.upload(screen.getByLabelText(/screenshot/i), file);
    
    // Wait for file upload to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /deposit/i }));
    
    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/deposit request submitted successfully/i)).toBeInTheDocument();
    });
    
    // Verify form was reset
    expect(screen.getByLabelText(/amount/i)).toHaveValue('');
    expect(screen.getByLabelText(/transaction hash/i)).toHaveValue('');
    
    // Verify invalidateQueries was called to refresh wallet data
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallets'] });
  });

  it('displays error message when deposit fails', async () => {
    // Mock mutation to simulate error
    mockMutateAsync.mockRejectedValueOnce(new Error('Invalid transaction hash'));
    
    renderDepositUsdtForm();
    const user = userEvent.setup();
    
    // Fill in the form
    await user.type(screen.getByLabelText(/amount/i), '100.50');
    await user.type(screen.getByLabelText(/transaction hash/i), '0x123abc456def');
    
    // Mock file upload
    const file = createTestFile();
    await user.upload(screen.getByLabelText(/screenshot/i), file);
    
    // Wait for file upload to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /deposit/i }));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid transaction hash/i)).toBeInTheDocument();
    });
  });
}); 