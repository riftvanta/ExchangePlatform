import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  
  // Reset mocks and set up default mock implementation
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for useAuth
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      error: null,
      user: null,
      isLoading: false,
    });
  });

  // Helper function to render the component with router
  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderLoginForm();
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    
    // Check for links
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
  });

  it('allows entering email and password', async () => {
    renderLoginForm();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls login function with email and password when form is submitted', async () => {
    renderLoginForm();
    const user = userEvent.setup();
    
    // Fill out the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Check that login was called with correct arguments
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('shows loading state during form submission', async () => {
    // Mock loading state
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      error: null,
      user: null,
      isLoading: true,
    });
    
    renderLoginForm();
    
    // Check for loading indicator
    expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
    
    // Check that the button is disabled
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays an error message when login fails', () => {
    // Mock error state
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      error: 'Invalid email or password',
      user: null,
      isLoading: false,
    });
    
    renderLoginForm();
    
    // Check for error message
    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('navigates to home page when user is authenticated', async () => {
    // First render without a user
    const { rerender } = render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
    
    // Then update the mock to include a user
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      error: null,
      user: { id: '123', email: 'test@example.com' },
      isLoading: false,
    });
    
    // Re-render with the updated mock
    rerender(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );
    
    // Check that navigate was called with '/'
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
}); 