import {
    createContext,
    useState,
    useEffect,
    useContext,
    ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Define the User type based on the data structure from the /api/me endpoint
export type User = {
    id: string;
    email: string;
    createdAt: string;
    twoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    firstName?: string | null;
    lastName?: string | null;
    isAdmin?: boolean;
};

// Define the shape of our authentication context
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (
        email: string,
        password: string,
        firstName: string,
        lastName: string
    ) => Promise<void>;
    error: string | null;
}

// Create the context with a default value of null
const AuthContext = createContext<AuthContextType | null>(null);

// Props for the AuthProvider component
interface AuthProviderProps {
    children: ReactNode;
}

// AuthProvider component to wrap around our application
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Function to login the user
    const loginUser = async (credentials: {
        email: string;
        password: string;
    }): Promise<User | null> => {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            // Check if response contains content before parsing JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > 0) {
                    const data = await response.json();
                    throw new Error(data.error || 'Login failed');
                }
            }
            throw new Error(`Login failed with status: ${response.status}`);
        }
        
        // Check if response contains valid JSON content before parsing
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Invalid content type:', contentType);
            throw new Error('Unexpected response from server');
        }

        const contentLength = response.headers.get('Content-Length');
        if (contentLength === '0') {
            console.warn('Empty response body');
            throw new Error('Empty response body');
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            console.error('JSON parsing error:', error);
            throw new Error('Invalid JSON response from server');
        }

        // Set the user in the context
        setUser(data.user);
        return data.user;
    };

    // Function to register a new user
    const registerUser = async (credentials: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
    }): Promise<void> => {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Registration failed');
        }
    };

    // Query to fetch user data
    const {
        data,
        isLoading: isUserLoading,
        error: userError,
        refetch,
    } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await fetch('/api/me');
            if (!response.ok) {
                if (response.status === 401) {
                    return null;
                }
                const data = await response.json();
                console.error('/api/me error:', data);
                throw new Error(data.error || 'Failed to fetch user');
            }
            const data = await response.json();
            return data.user as User;
        },
        onSuccess: (userData: User | null) => {
            setUser(userData);
            setIsLoading(false);
        },
    } as any); // Use type assertion to avoid TypeScript errors

    const loginMutation = useMutation({
        mutationFn: loginUser,
        onMutate: () => {
            setIsLoading(true);
            setError(null); // Clear any previous errors
        },
        onSuccess: async (userData) => {
            try {
                if (userData) {
                    // If user data was returned directly from login, use it
                    setUser(userData);
                } else {
                    // Otherwise, fetch user data
                    const result = await refetch();
                    // Check if user data was fetched successfully
                    if (result.data) {
                        setUser(result.data as User);
                    }
                }
            } catch (refetchError) {
                console.error('Error handling user data after login:', refetchError);
                setError('Failed to load user data after login');
            } finally {
                setIsLoading(false); // Set isLoading to false after refetch
            }
        },
        onError: (error: Error) => {
            console.error('Login mutation error:', error);
            setError(error.message || 'Login failed');
            setIsLoading(false);
        },
    });

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onMutate: () => {
            setIsLoading(true);
            setError(null); // Clear any previous errors
        },
        onSuccess: async () => {
            try {
                const result = await refetch();

                // Check if user data was fetched successfully
                if (result.data) {
                    setUser(result.data as User);
                }
            } catch (refetchError) {
                console.error('Error refetching user data:', refetchError);
                setError('Failed to load user data after registration');
            } finally {
                setIsLoading(false); // Set isLoading to false after refetch
            }
        },
        onError: (error: Error) => {
            console.error('Registration mutation error:', error);
            setError(error.message || 'Registration failed');
            setIsLoading(false);
        },
    });

    // Updated logout function
    const logout = async (): Promise<void> => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Even if the API call fails, we still want to clear the user state
            setUser(null);
            queryClient.setQueryData(['user'], null);
        }
    };

    // Create the context value object
    const contextValue: AuthContextType = {
        user,
        isLoading,
        login: async (email, password) => {
            setError(null); // Reset error on new login attempt
            setIsLoading(true); // set isLoading to true
            try {
                return await loginMutation.mutateAsync({ email, password });
            } finally {
                setIsLoading(false);
            }
        },
        logout,
        register: async (email, password, firstName, lastName) => {
            setError(null); // Reset error on new registration attempt
            setIsLoading(true);
            try {
                return await registerMutation.mutateAsync({
                    email,
                    password,
                    firstName,
                    lastName,
                });
            } finally {
                setIsLoading(false);
            }
        },
        error,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
