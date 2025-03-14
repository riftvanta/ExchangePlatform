import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DepositData {
    amount: string;
    transactionHash: string;
    fileKey: string;
}

function DepositUsdtForm() {
    const [amount, setAmount] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const depositMutation = useMutation<any, Error, DepositData>({
        mutationFn: async (data: DepositData) => {
            const response = await fetch('/api/deposit/usdt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Deposit failed');
            }

            return response.json(); // We now expect a JSON response with a message
        },
        onSuccess: (data) => {
            // data now contains the response from the server.
            queryClient.invalidateQueries({ queryKey: ['wallets'] });
            setAmount(''); // Clear form
            setTransactionHash(''); // Clear form
            setFile(null); // Clear the file input
            setFileKey(null); // Clear file key
            setError(null);
            setSuccessMessage(data.message); // Set success message from the response.
        },
        onError: (err: Error) => {
            setError(err.message || 'Deposit failed');
            setSuccessMessage(null); // Clear success message on error
        },
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) {
            return;
        }

        setFile(selectedFile);

        try {
            const response = await fetch('/api/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contentType: selectedFile.type }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get upload URL');
            }

            const { uploadURL, key } = await response.json();

            // Upload file directly to S3.
            const uploadResponse = await fetch(uploadURL, {
                method: 'PUT',
                body: selectedFile,
                headers: {
                    'Content-Type': selectedFile.type,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }
            setFileKey(key);
        } catch (error: any) {
            setError(error.message || 'Upload failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileKey) {
            setError('Please upload a deposit screenshot first');
            return;
        }
        depositMutation.mutateAsync({ amount, transactionHash, fileKey }); // Include fileKey
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="deposit-form">
                <div className="form-group">
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="transactionHash">Transaction Hash:</label>
                    <input
                        type="text"
                        id="transactionHash"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="file">Deposit Screenshot:</label>
                    <input
                        type="file"
                        id="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />
                    {file && (
                        <div className="file-info">File selected: {file.name}</div>
                    )}
                    {fileKey && (
                        <div className="alert success">
                            File uploaded successfully
                        </div>
                    )}
                </div>
                {error && <div className="alert error">{error}</div>}
                {successMessage && (
                    <div className="alert success">{successMessage}</div>
                )}
                <button 
                    type="submit" 
                    disabled={depositMutation.isPending}
                    className="button"
                >
                    {depositMutation.isPending
                        ? 'Submitting Deposit...'
                        : 'Deposit USDT'}
                </button>
            </form>
        </div>
    );
}

export default DepositUsdtForm;
