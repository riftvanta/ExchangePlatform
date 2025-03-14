import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ResendVerification() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (!user) {
      setStatus('error');
      setErrorMessage('You must be logged in to resend verification');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
      console.error('Resend verification error:', error);
    }
  };

  // If user is not logged in, redirect to login
  if (!user && status === 'idle') {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="dashboard-section" style={{ maxWidth: '500px' }}>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Resend Verification Email</h1>
        
        {status === 'idle' && (
          <div className="text-center p-4">
            <p className="mb-4 text-gray-600">
              If you haven't received your verification email or the link has expired, 
              you can request a new one by clicking the button below.
            </p>
            <button
              onClick={handleResendVerification}
              className="button w-full"
            >
              Resend Verification Email
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center p-4">
            <p className="mb-4 text-gray-600">Sending verification email...</p>
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
            <p className="mt-4 text-lg font-medium text-gray-700">Verification email sent!</p>
            <p className="mt-2 text-gray-500">
              Please check your email inbox for the verification link. 
              Don't forget to check your spam folder too.
            </p>
            <Link to="/login" className="button text mt-4 block text-center">
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
            <p className="mt-4 text-lg font-medium text-gray-700">Failed to Resend</p>
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

export default ResendVerification; 