import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginForm() {
    const { login, error, user, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // Add effect to redirect when user becomes available
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            // Don't navigate here - we'll navigate in the useEffect
            // when the user data becomes available
        } catch (error: any) {
            // Error handling is already in place in AuthContext
            console.error('Login error:', error);
        }
    };

    return (
        <div className="login-form-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="alert error">
                        {error}
                    </div>
                )}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <div className="mt-4 text-center">
                <Link to="/forgot-password" className="text-blue-500 hover:underline">
                    Forgot your password?
                </Link>
            </div>

            <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                    Need to verify your email?{' '}
                    <Link to="/resend-verification" className="text-blue-500 hover:underline">
                        Resend verification email
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginForm;
