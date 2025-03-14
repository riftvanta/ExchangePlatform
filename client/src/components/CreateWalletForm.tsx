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
        <div>
            <h3>Create New Wallet</h3>
            
            {/* Success Message */}
            {success && (
                <div className="verification-banner" style={{ backgroundColor: '#e6f7ef', borderColor: '#84e1bc' }} role="alert">
                    <div className="message" style={{ color: '#0d7d4d' }}>
                        <span role="img" aria-label="Success">✅</span> {success}
                    </div>
                </div>
            )}
            
            {/* General Form Error */}
            {formError && !formError.errors && (
                <div className="verification-banner" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }} role="alert">
                    <div className="message" style={{ color: '#b91c1c' }}>
                        <span role="img" aria-label="Error">❌</span> {formError.message}
                    </div>
                </div>
            )}
            
            {/* Wallet Creation Form */}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="currency">Currency:</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={formError?.errors?.currency ? "error" : ""}
                        aria-invalid={formError?.errors?.currency ? "true" : "false"}
                        aria-describedby={formError?.errors?.currency ? "currency-error" : undefined}
                        required
                    >
                        <option value="">Select a currency</option>
                        <option value="USDT">USDT (Tether)</option>
                        <option value="JOD">JOD (Jordanian Dinar)</option>
                    </select>
                    
                    {formError?.errors?.currency && (
                        <div id="currency-error" className="form-error" role="alert">
                            {formError.errors.currency.join('. ')}
                        </div>
                    )}
                </div>
                
                <div className="form-info" style={{ marginBottom: '16px' }}>
                    <p><span role="img" aria-label="Info">ℹ️</span> Creating a wallet allows you to deposit, withdraw, and manage funds in the selected currency.</p>
                </div>
                
                <button
                    type="submit"
                    className="button"
                    disabled={createWalletMutation.isPending}
                    aria-busy={createWalletMutation.isPending}
                >
                    {createWalletMutation.isPending ? (
                        <>
                            <span className="loading-spinner-small" aria-hidden="true"></span>
                            <span>Creating Wallet...</span>
                        </>
                    ) : 'Create Wallet'}
                </button>
            </form>
        </div>
    );
}

export default CreateWalletForm;
