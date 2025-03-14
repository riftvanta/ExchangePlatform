import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseApiError, ApiError } from '../../lib/errorHandler';
import ErrorDisplay from '../ErrorDisplay';

// Import our Joy UI components
import { Button, FormControl, Typography, Alert } from './index';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Box from '@mui/joy/Box';

interface CreateWalletFormData {
    currency: string;
}

function CreateWalletFormJoy() {
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
        <Box sx={{ p: 2, maxWidth: '600px' }}>
            {success && (
                <Alert
                    color="success"
                    variant="soft"
                    sx={{ mb: 2 }}
                >
                    {success}
                </Alert>
            )}
            
            {formError && (
                <ErrorDisplay 
                    error={formError} 
                    variant="alert"
                    onDismiss={() => setFormError(null)} 
                />
            )}
            
            <form onSubmit={handleSubmit}>
                <FormControl
                    label="Currency"
                    error={Boolean(formError?.errors?.currency)}
                    errorText={formError?.errors?.currency?.join('. ')}
                >
                    <Select
                        value={currency}
                        onChange={(e, newValue) => setCurrency(newValue as string)}
                        placeholder="Select a currency"
                        sx={{ width: '100%' }}
                    >
                        <Option value="USDT">USDT (Tether)</Option>
                        <Option value="JOD">JOD (Jordanian Dinar)</Option>
                    </Select>
                </FormControl>
                
                <Button
                    type="submit"
                    loading={createWalletMutation.isPending}
                    sx={{ mt: 2 }}
                >
                    {createWalletMutation.isPending ? 'Creating Wallet...' : 'Create Wallet'}
                </Button>
            </form>
        </Box>
    );
}

export default CreateWalletFormJoy; 