import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResendVerification() {
    const { user } = useAuth();
    const [email, setEmail] = useState(user?.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend verification email');
            }

            setSuccessMessage(data.message || 'Verification email sent successfully');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="verification-page">
            <div className="app-logo">
                <h1>USDT-JOD Exchange</h1>
                <p>Your secure platform for cryptocurrency exchange</p>
            </div>

            <div className="login-form-container">
                <h2>Verify Your Email</h2>
                
                {!successMessage ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>

                        {error && <div className="alert error">{error}</div>}

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                    </form>
                ) : (
                    <div className="alert success">{successMessage}</div>
                )}

                <div className="auth-links">
                    <p>
                        <Link to="/login">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
} 