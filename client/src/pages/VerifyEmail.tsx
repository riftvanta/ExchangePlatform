import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch(`/api/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          // After successful verification, wait 3 seconds and redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setVerificationStatus('error');
          setErrorMessage(data.error || 'Email verification failed');
        }
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred');
        console.error('Verification error:', error);
      }
    }

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="dashboard-section" style={{ maxWidth: '500px' }}>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Email Verification</h1>
        
        {verificationStatus === 'loading' && (
          <div className="text-center p-4">
            <p className="mb-4 text-gray-600">Verifying your email...</p>
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {verificationStatus === 'success' && (
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
            <p className="mt-4 text-lg font-medium text-gray-700">Your email has been successfully verified!</p>
            <p className="mt-2 text-gray-500">You will be redirected to the login page shortly.</p>
            <Link to="/login" className="button text mt-4">
              Click here if you are not redirected automatically
            </Link>
          </div>
        )}

        {verificationStatus === 'error' && (
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
            <p className="mt-4 text-lg font-medium text-gray-700">Verification Failed</p>
            <div className="alert error mt-2">
              {errorMessage}
            </div>
            <div className="mt-6 space-y-2">
              <Link to="/login" className="button">
                Return to login
              </Link>
              <button
                onClick={() => navigate('/resend-verification')}
                className="button text w-full mt-2"
              >
                Resend verification email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail; 