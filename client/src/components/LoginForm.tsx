import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginForm() {
    const { login, error: authError, user, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Add effect to redirect when user becomes available
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            // Don't navigate here - we'll navigate in the useEffect
            // when the user data becomes available
        } catch (error: any) {
            // Error handling is already in place in AuthContext
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loading = isLoading || authLoading;
    const error = authError;

    return (
        <div className="auth-form-container">
            <h2 className="auth-title">Login</h2>
            <p className="auth-subtitle">
                Welcome back! Please login to your account
            </p>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        required
                        className="auth-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        required
                        className="auth-input"
                    />
                    <div className="forgot-password-link">
                        <Link to="/forgot-password">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="auth-error-message">
                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="auth-button"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div className="auth-divider">
                <span>OR</span>
            </div>

            <div className="auth-links">
                <p>
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-link">
                        Create Account
                    </Link>
                </p>
                
                <p className="auth-secondary-link">
                    <Link to="/resend-verification">
                        Need to verify your email?
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginForm;
