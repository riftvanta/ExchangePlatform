import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setErrorMessage('Email is required');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send password reset email');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
      console.error('Password reset request error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="dashboard-section" style={{ maxWidth: '500px' }}>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Forgot Password</h1>
        
        {status === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="button w-full"
              >
                Send Reset Link
              </button>
            </div>
            <div className="text-center mt-4">
              <p>
                Remembered your password?{' '}
                <Link to="/login" className="button text">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        )}

        {status === 'loading' && (
          <div className="text-center p-4">
            <p className="mb-4 text-gray-600">Sending password reset email...</p>
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
            <p className="mt-4 text-lg font-medium text-gray-700">Reset link sent!</p>
            <p className="mt-2 text-gray-500">
              If an account exists with the email {email}, you will receive a password reset link shortly.
              Please check your email inbox and spam folder.
            </p>
            <Link to="/login" className="button text mt-4 block">
              Return to login
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
            <p className="mt-4 text-lg font-medium text-gray-700">Failed to Send Reset Link</p>
            <div className="alert error mt-2">
              {errorMessage}
            </div>
            <div className="mt-6">
              <button
                onClick={() => setStatus('idle')}
                className="button w-full"
              >
                Try Again
              </button>
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

export default ForgotPassword; 