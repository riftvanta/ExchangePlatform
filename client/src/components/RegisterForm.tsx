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
        <div className="registration-form-container">
            <h2>Create Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">
                        <i className="fa-solid fa-user"></i> First Name
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="lastName">
                        <i className="fa-solid fa-user"></i> Last Name
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="register-email">
                        <i className="fa-solid fa-envelope"></i> Email
                    </label>
                    <input
                        type="email"
                        id="register-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="register-password">
                        <i className="fa-solid fa-lock"></i> Password
                    </label>
                    <input
                        type="password"
                        id="register-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                    />
                </div>

                {displayError && (
                    <div className="alert error">
                        <i className="fa-solid fa-circle-exclamation"></i> {displayError}
                    </div>
                )}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <i className="fa-solid fa-spinner fa-spin"></i> Creating Account...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-user-plus"></i> Create Account
                        </>
                    )}
                </button>
            </form>

            <div className="auth-links">
                <p>
                    <i className="fa-solid fa-right-to-bracket"></i>
                    Already have an account?{' '}
                    <Link to="/login" className="signup-link">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
