import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError, ApiError } from '../lib/errorHandler';
import ErrorDisplay from './ErrorDisplay';

interface CreateWalletFormData {
    currency: string;
}

function CreateWalletForm() {
    const [currency, setCurrency] = useState<string>('');
    const [formError, setFormError] = useState<ApiError | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const createWalletMutation = useMutation<any, ApiError, CreateWalletFormData>({
        mutationFn: async (data: CreateWalletFormData) => {
            const response = await fetch('/api/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                // Use our error parsing utility to standardize error handling
                const error = await parseApiError(response);
                throw error;
            }

            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            setCurrency('');
            setFormError(null);
            setSuccess(`Your new ${data.wallet.currency} wallet has been created successfully.`);
            
            // Clear success message after 5 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 5000);
        },
        onError: (error: ApiError) => {
            setFormError(error);
            setSuccess(null);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSuccess(null);
        
        if (!currency) {
            setFormError({
                message: 'Please select a currency',
                code: 'VALIDATION_ERROR',
                errors: {
                    currency: ['Currency selection is required']
                }
            });
            return;
        }

        createWalletMutation.mutate({ currency });
    };

    return (
        <div className="wallet-form-container">
            {success && (
                <div className="success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    <span>{success}</span>
                </div>
            )}
            
            {formError && (
                <ErrorDisplay 
                    error={formError} 
                    variant="alert"
                    className="mb-4"
                    onDismiss={() => setFormError(null)} 
                />
            )}
            
            <form onSubmit={handleSubmit} className="wallet-form">
                <div className="form-group">
                    <label htmlFor="currency" className="form-label">Currency</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="form-select"
                        aria-label="Select currency"
                    >
                        <option value="">Select a currency</option>
                        <option value="USDT">USDT (Tether)</option>
                        <option value="JOD">JOD (Jordanian Dinar)</option>
                    </select>
                    {formError && formError.errors?.currency && (
                        <ErrorDisplay 
                            error={formError.errors.currency.join('. ')} 
                            variant="inline" 
                        />
                    )}
                </div>
                
                <button
                    type="submit"
                    className="button primary"
                    disabled={createWalletMutation.isPending}
                >
                    {createWalletMutation.isPending ? 'Creating Wallet...' : 'Create Wallet'}
                </button>
            </form>
        </div>
    );
}

export default CreateWalletForm;
