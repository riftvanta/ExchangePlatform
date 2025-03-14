import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface DepositData {
    amount: string;
    transactionHash: string;
    fileKey: string;
    depositAddress?: string;
}

interface DepositAddress {
    id: string;
    address: string;
    currency: string;
    network: string;
    isActive: boolean;
    lastUsed?: string;
    label?: string;
}

function DepositUsdtForm() {
    const [amount, setAmount] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const queryClient = useQueryClient();

    // Fetch the user's USDT deposit address
    const { data: depositAddresses, isLoading: isLoadingAddresses, error: addressError } = useQuery({
        queryKey: ['depositAddresses', 'USDT', 'TRC20'],
        queryFn: async () => {
            const response = await fetch('/api/deposit-address?currency=USDT&network=TRC20', {
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch deposit address');
            }
            
            return response.json();
        }
    });

    // Mutation to create a new deposit address if none exists
    const createAddressMutation = useMutation({
        mutationFn: async () => {
            setIsAddressLoading(true);
            const response = await fetch('/api/deposit-address', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currency: 'USDT',
                    network: 'TRC20',
                    label: 'Default USDT Address'
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create deposit address');
            }
            
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['depositAddresses'] });
            setIsAddressLoading(false);
        },
        onError: (err: Error) => {
            setError(err.message);
            setIsAddressLoading(false);
        }
    });

    // Create a new address if none exists
    useEffect(() => {
        if (!isLoadingAddresses && depositAddresses && 
            (!depositAddresses.addresses || depositAddresses.addresses.length === 0)) {
            createAddressMutation.mutate();
        }
    }, [depositAddresses, isLoadingAddresses]);

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
        
        // Include the deposit address in the request if available
        const depositData: DepositData = { 
            amount, 
            transactionHash, 
            fileKey 
        };
        
        // Add deposit address if available
        if (userAddress) {
            depositData.depositAddress = userAddress.address;
        }
        
        depositMutation.mutateAsync(depositData);
    };

    const copyAddressToClipboard = (address: string) => {
        navigator.clipboard.writeText(address)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000); // Reset after 3 seconds
            })
            .catch(err => {
                console.error('Failed to copy address: ', err);
            });
    };

    // Get the user's deposit address if available
    const userAddress = depositAddresses?.addresses?.length > 0 
        ? depositAddresses.addresses[0]
        : null;

    return (
        <div className="deposit-form-container">
            <h2>Deposit USDT</h2>
            
            {/* Deposit Address Section */}
            <div className="deposit-address-section">
                <h3>Your Personal USDT Deposit Address (TRC20)</h3>
                
                {isLoadingAddresses || isAddressLoading ? (
                    <div className="loading">Loading your deposit address...</div>
                ) : addressError ? (
                    <div className="alert error">Error loading deposit address</div>
                ) : !userAddress ? (
                    <div className="alert warning">
                        No deposit address found. 
                        <button 
                            onClick={() => createAddressMutation.mutate()}
                            disabled={createAddressMutation.isPending}
                            className="button small"
                        >
                            Generate Address
                        </button>
                    </div>
                ) : (
                    <div className="deposit-address-card">
                        <div className="address-display">
                            <span className="address-text">{userAddress.address}</span>
                            <button 
                                onClick={() => copyAddressToClipboard(userAddress.address)}
                                className="copy-button"
                                title="Copy to clipboard"
                            >
                                {isCopied ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="address-info">
                            <p><strong>Network:</strong> TRC20 (TRON)</p>
                            <p><strong>Important:</strong> Send only USDT to this address. Sending any other currency may result in permanent loss.</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Deposit Form */}
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
