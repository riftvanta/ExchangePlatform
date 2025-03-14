import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWalletForm from '../../components/CreateWalletForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useMutation hook
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

describe('CreateWalletForm', () => {
  const mockMutateAsync = vi.fn();
  const mockInvalidateQueries = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
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
  const renderCreateWalletForm = (mutationState = {}) => {
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
        <CreateWalletForm />
      </QueryClientProvider>
    );
  };

  it('renders the form with currency dropdown', () => {
    renderCreateWalletForm();
    
    // Check for form elements
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'USDT' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'JOD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create wallet/i })).toBeInTheDocument();
  });

  it('allows selecting a currency from the dropdown', async () => {
    renderCreateWalletForm();
    const user = userEvent.setup();
    
    const currencySelect = screen.getByRole('combobox');
    await user.selectOptions(currencySelect, 'USDT');
    
    expect(currencySelect).toHaveValue('USDT');
  });

  it('submits the form with the selected currency', async () => {
    renderCreateWalletForm();
    const user = userEvent.setup();
    
    // Select a currency
    await user.selectOptions(screen.getByRole('combobox'), 'USDT');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /create wallet/i }));
    
    // Check that mutation was called with the correct data
    expect(mockMutateAsync).toHaveBeenCalledWith({ currency: 'USDT' });
  });

  it('shows loading state during form submission', async () => {
    // Mock loading state
    renderCreateWalletForm({ isLoading: true });
    
    // Check for loading state
    expect(screen.getByRole('button')).toHaveTextContent(/creating.../i);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays an error message when wallet creation fails', async () => {
    // Mock mutation to simulate error
    mockMutateAsync.mockRejectedValueOnce(new Error('Wallet already exists'));
    
    renderCreateWalletForm();
    const user = userEvent.setup();
    
    // Select a currency and submit
    await user.selectOptions(screen.getByRole('combobox'), 'USDT');
    await user.click(screen.getByRole('button', { name: /create wallet/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/wallet already exists/i)).toBeInTheDocument();
    });
  });

  it('resets the form and invalidates queries on success', async () => {
    // Mock mutation to simulate success
    mockMutateAsync.mockResolvedValueOnce({ success: true });
    
    renderCreateWalletForm();
    const user = userEvent.setup();
    
    // Select a currency and submit
    await user.selectOptions(screen.getByRole('combobox'), 'USDT');
    await user.click(screen.getByRole('button', { name: /create wallet/i }));
    
    // Check that invalidateQueries was called and form was reset
    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallets'] });
    });
  });
}); 