import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterForm = () => {
    const navigate = useNavigate();
    const { register, error: authError, user } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Add effect to redirect when user becomes available
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setPasswordError(null);

        // Password validation
        if (password !== confirmPassword) {
            setPasswordError("Passwords don't match");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        try {
            await register(email, password, firstName, lastName);
            // Don't navigate here - we'll navigate in the useEffect
            // when the user data becomes available
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Display either the local error or the auth context error
    const displayError = error || authError;

    return (
        <div className="auth-form-container">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">
                Join our platform to exchange USDT and JOD securely
            </p>
            
            <form onSubmit={handleSubmit}>
                <div className="name-fields-row">
                    <div className="form-group half-width">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="F"
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="form-group half-width">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="L"
                            required
                            className="auth-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="register-email">Email</label>
                    <input
                        type="email"
                        id="register-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        required
                        className="auth-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="register-password">Password</label>
                    <input
                        type="password"
                        id="register-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="auth-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="auth-input"
                    />
                    {passwordError && (
                        <p className="input-error-message">{passwordError}</p>
                    )}
                </div>

                {displayError && (
                    <div className="auth-error-message">
                        <i className="fa-solid fa-circle-exclamation"></i> {displayError}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="auth-button"
                >
                    {isLoading ? "Creating Account..." : "Create Account"}
                </button>
            </form>

            <div className="auth-divider">
                <span>OR</span>
            </div>

            <div className="auth-links">
                <p>
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
