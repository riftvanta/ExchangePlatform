import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setStatus('error');
      setErrorMessage('Reset token is missing');
      return;
    }

    if (!password) {
      setStatus('error');
      setErrorMessage('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match');
      return;
    }

    // Simple password strength validation
    if (password.length < 8) {
      setStatus('error');
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        // After successful reset, wait 3 seconds and redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
      console.error('Password reset error:', error);
    }
  };

  if (!token && status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="dashboard-section" style={{ maxWidth: '500px' }}>
          <svg
            className="w-16 h-16 mx-auto text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Invalid Reset Link</h1>
          <p className="text-center text-gray-600 mb-6">
            The password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="button w-full block text-center"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="dashboard-section" style={{ maxWidth: '500px' }}>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Reset Your Password</h1>
        
        {status === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
            </div>
            <div>
              <button type="submit" className="button w-full">
                Reset Password
              </button>
            </div>
          </form>
        )}

        {status === 'loading' && (
          <div className="text-center p-4">
            <p className="mb-4 text-gray-600">Resetting your password...</p>
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center p-4">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-700">Password Reset Successful!</p>
            <p className="mt-2 text-gray-500">
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </p>
            <Link to="/login" className="button text mt-4 block">
              Click here if you are not redirected automatically
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center p-4">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-700">Password Reset Failed</p>
            <div className="alert error mt-2">
              {errorMessage}
            </div>
            <div className="mt-6">
              {errorMessage === 'Invalid or expired reset token' ? (
                <Link
                  to="/forgot-password"
                  className="button w-full block text-center"
                >
                  Request a new reset link
                </Link>
              ) : (
                <button
                  onClick={() => setStatus('idle')}
                  className="button w-full"
                >
                  Try Again
                </button>
              )}
              <Link to="/login" className="button text mt-4 block text-center">
                Return to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword; 