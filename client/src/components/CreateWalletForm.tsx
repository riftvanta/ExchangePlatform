import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateWalletData {
    currency: string;
}

function CreateWalletForm() {
    const [currency, setCurrency] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const createWalletMutation = useMutation<any, Error, CreateWalletData>({
        mutationFn: async (data: CreateWalletData) => {
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create wallet');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            setCurrency(''); // Clear the form
            setError(null);
        },
        onError: (err: Error) => {
            setError(err.message || 'Failed to create wallet');
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createWalletMutation.mutateAsync({ currency });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Create New Wallet</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="currency">Currency:</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        required
                    >
                        <option value="">Select Currency</option>
                        <option value="USDT">USDT</option>
                        <option value="JOD">JOD</option>
                    </select>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Wallet'}
                </button>
            </form>
        </div>
    );
}

export default CreateWalletForm;
