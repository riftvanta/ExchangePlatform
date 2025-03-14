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
                    <label htmlFor="email">
                        <i className="fa-solid fa-envelope"></i> Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">
                        <i className="fa-solid fa-lock"></i> Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>

                {error && (
                    <div className="alert error">
                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                    </div>
                )}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <i className="fa-solid fa-spinner fa-spin"></i> Logging in...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-right-to-bracket"></i> Login
                        </>
                    )}
                </button>
            </form>

            <div className="auth-links">
                <p>
                    <i className="fa-solid fa-user-plus"></i>
                    Don't have an account?{' '}
                    <Link to="/register" className="signup-link">
                        Sign up
                    </Link>
                </p>
                
                <p>
                    <i className="fa-solid fa-key"></i>
                    <Link to="/forgot-password">
                        Forgot your password?
                    </Link>
                </p>
                
                <p>
                    <i className="fa-solid fa-envelope-circle-check"></i>
                    Need to verify your email?{' '}
                    <Link to="/resend-verification">
                        Resend verification email
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginForm;
