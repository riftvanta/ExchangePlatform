import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component that uses the auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="user">{JSON.stringify(auth.user)}</div>
      <div data-testid="error">{auth.error}</div>
      <button 
        onClick={() => auth.login('test@example.com', 'password')}
        data-testid="login-button"
      >
        Login
      </button>
      <button 
        onClick={() => auth.logout()}
        data-testid="logout-button"
      >
        Logout
      </button>
      <button 
        onClick={() => auth.register('test@example.com', 'password', 'Test', 'User')}
        data-testid="register-button"
      >
        Register
      </button>
    </div>
  );
}

// Wrapper for rendering with AuthProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock session check - default to not logged in
    mockFetch.mockImplementation((url) => {
      if (url === '/api/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('should initialize with user as null and isLoading as true', async () => {
    render(<TestComponent />, { wrapper });
    
    // Initially isLoading should be true
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // After session check completes, isLoading should be false
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // User should be null
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('should set user after successful login', async () => {
    // Mock successful login response
    mockFetch.mockImplementation((url) => {
      if (url === '/api/login') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              createdAt: '2023-01-01',
              twoFactorEnabled: false,
              twoFactorSecret: null,
              firstName: 'Test',
              lastName: 'User',
              isAdmin: false,
              emailVerified: true
            }
          }),
        });
      }
      if (url === '/api/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              createdAt: '2023-01-01',
              twoFactorEnabled: false,
              twoFactorSecret: null,
              firstName: 'Test',
              lastName: 'User',
              isAdmin: false,
              emailVerified: true
            }
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<TestComponent />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Click login button
    await act(async () => {
      screen.getByTestId('login-button').click();
    });
    
    // Check that user is set after login
    await waitFor(() => {
      const userContent = screen.getByTestId('user').textContent;
      expect(userContent).toContain('test@example.com');
      expect(userContent).toContain('Test');
      expect(userContent).toContain('User');
    });
  });

  it('should set error on failed login', async () => {
    // Mock failed login response
    mockFetch.mockImplementation((url) => {
      if (url === '/api/login') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
        });
      }
      if (url === '/api/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<TestComponent />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Click login button
    await act(async () => {
      screen.getByTestId('login-button').click();
    });
    
    // Check that error is set after failed login
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
    });
  });

  it('should clear user after logout', async () => {
    // First mock successful login
    mockFetch.mockImplementation((url) => {
      if (url === '/api/login') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              createdAt: '2023-01-01',
              twoFactorEnabled: false,
              twoFactorSecret: null,
              firstName: 'Test',
              lastName: 'User',
              isAdmin: false,
              emailVerified: true
            }
          }),
        });
      }
      if (url === '/api/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              createdAt: '2023-01-01',
              twoFactorEnabled: false,
              twoFactorSecret: null,
              firstName: 'Test',
              lastName: 'User',
              isAdmin: false,
              emailVerified: true
            }
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<TestComponent />, { wrapper });
    
    // Login
    await act(async () => {
      screen.getByTestId('login-button').click();
    });
    
    // Check user is set
    await waitFor(() => {
      const userContent = screen.getByTestId('user').textContent;
      expect(userContent).toContain('test@example.com');
    });
    
    // Now change mock for logout and the subsequent /api/me check
    mockFetch.mockImplementation((url) => {
      if (url === '/api/logout') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Logged out successfully' }),
        });
      }
      if (url === '/api/me') {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Not authenticated' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    // Logout
    await act(async () => {
      screen.getByTestId('logout-button').click();
    });
    
    // Check user is null after logout
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('should register a new user successfully', async () => {
    // Mock successful registration
    mockFetch.mockImplementation((url) => {
      if (url === '/api/register') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              createdAt: '2023-01-01',
              twoFactorEnabled: false,
              twoFactorSecret: null,
              firstName: 'Test',
              lastName: 'User',
              isAdmin: false,
              emailVerified: false
            }
          }),
        });
      }
      if (url === '/api/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              createdAt: '2023-01-01',
              twoFactorEnabled: false,
              twoFactorSecret: null,
              firstName: 'Test',
              lastName: 'User',
              isAdmin: false,
              emailVerified: false
            }
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<TestComponent />, { wrapper });
    
    // Register
    await act(async () => {
      screen.getByTestId('register-button').click();
    });
    
    // Check user is set after registration
    await waitFor(() => {
      const userContent = screen.getByTestId('user').textContent;
      expect(userContent).toContain('test@example.com');
      expect(userContent).toContain('emailVerified":false');
    });
  });
}); 