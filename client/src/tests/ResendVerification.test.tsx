import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import ResendVerification from '../pages/ResendVerification';
import * as AuthContext from '../context/AuthContext';

// Mock fetch
global.fetch = vi.fn();

// Mock the AuthContext
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { email: 'test@example.com', emailVerified: false },
      isLoading: false,
    }),
  };
});

describe('ResendVerification Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders correctly with email from context', () => {
    render(<ResendVerification />);
    
    expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    // Mock fetch to return success
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Verification email sent successfully' }),
    });

    render(<ResendVerification />);
    
    const submitButton = screen.getByText('Resend Verification Email');
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    
    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText('Verification email sent successfully')).toBeInTheDocument();
    });
    
    // Verify fetch was called with the correct arguments
    expect(global.fetch).toHaveBeenCalledWith('/api/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('handles API errors', async () => {
    // Mock fetch to return an error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to send verification email' }),
    });

    render(<ResendVerification />);
    
    const submitButton = screen.getByText('Resend Verification Email');
    fireEvent.click(submitButton);
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Failed to send verification email')).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    // Mock fetch to throw an error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<ResendVerification />);
    
    const submitButton = screen.getByText('Resend Verification Email');
    fireEvent.click(submitButton);
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
}); 