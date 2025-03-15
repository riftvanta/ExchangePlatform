import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Replace FaInfoCircle with a simple span for now until we install react-icons
// import { FaInfoCircle } from 'react-icons/fa';
import { toast } from './ui/Toast';
import { SavedAddress } from './SavedAddressesManager';
import { truncateAddress } from '../utils/formatters';

// Mock data for demonstration - will be replaced with API calls
const mockBalance = 179;

// Use a non-empty interface with at least one optional property
interface WithdrawalFormProps {
  className?: string; // Optional property to make the interface non-empty
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = () => {
  const [amount, setAmount] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  // Simulating API calls to fetch user's balance and saved addresses
  useEffect(() => {
    // In a real app, these would be API calls
    setAvailableBalance(mockBalance);
    
    // Fetch saved addresses from API
    const fetchSavedAddresses = async () => {
      try {
        // Simulating API call to fetch saved addresses
        // In real app, this would be an API call using fetch or axios
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // Mock data for now - would come from API in real app
        const mockAddresses: SavedAddress[] = [
          { id: '1', name: 'My Tron Wallet', address: 'TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe', isDefault: true, network: 'TRC20' },
          { id: '2', name: 'Trading Wallet', address: 'TYGe85nX8MJQBEZ8JEMYvbB2FhxfyXfZQQ', isDefault: false, network: 'TRC20' },
        ];
        
        setSavedAddresses(mockAddresses);
        
        // Set default address if available
        const defaultAddress = mockAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setAddress(defaultAddress.address);
        } else if (mockAddresses.length > 0) {
          setSelectedAddressId(mockAddresses[0].id);
          setAddress(mockAddresses[0].address);
        }
      } catch (error) {
        console.error('Error fetching saved addresses:', error);
        toast.error('Failed to load your saved addresses');
      }
    };
    
    fetchSavedAddresses();
  }, []);

  // Handle address selection change
  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    
    if (id) {
      const selectedAddress = savedAddresses.find(addr => addr.id === id);
      if (selectedAddress) {
        setAddress(selectedAddress.address);
      }
    }
    
    setUseNewAddress(false);
  };

  // Toggle between saved address and new address
  const handleToggleNewAddress = () => {
    setUseNewAddress(!useNewAddress);
    if (!useNewAddress) {
      setSelectedAddressId(null);
      setAddress('');
    } else if (savedAddresses.length > 0) {
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setAddress(defaultAddress.address);
      } else {
        setSelectedAddressId(savedAddresses[0].id);
        setAddress(savedAddresses[0].address);
      }
    }
  };

  // Validate amount input
  const validateAmount = (value: string) => {
    if (!value) return false;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    if (numValue <= 0) return false;
    if (numValue > availableBalance) return false;
    
    return true;
  };

  // Validate TRC20 address (basic validation)
  const validateAddress = (addr: string) => {
    // Basic validation: TRC20 addresses start with T and are 34 characters long
    return addr.startsWith('T') && addr.length === 34;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!validateAmount(amount)) {
      toast.error('Please enter a valid amount (greater than 0 and not exceeding your available balance)');
      return;
    }
    
    if (!validateAddress(address)) {
      toast.error('Please enter a valid TRC20 wallet address');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call to process withdrawal
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success('Withdrawal request submitted successfully! Your request is pending admin approval.');
      
      // Reset form
      setAmount('');
      
      // If it was a new address, reset address field
      if (useNewAddress) {
        setAddress('');
      }
      
    } catch (error) {
      toast.error('An error occurred while processing your withdrawal request. Please try again.');
      console.error('Withdrawal error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="withdrawal-form">
      <h2>Withdraw USDT</h2>
      
      <div className="balance-info">
        <span>Available Balance:</span>
        <span className="balance-amount">{availableBalance} USDT</span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount (USDT)</label>
          <input
            type="number"
            id="amount"
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter withdrawal amount"
            min="1"
            max={availableBalance.toString()}
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group withdrawal-address-group">
          <label htmlFor="walletAddress">Destination Wallet Address</label>
          
          {savedAddresses.length > 0 && (
            <>
              {!useNewAddress && (
                <select
                  id="savedAddresses"
                  className="saved-address-select"
                  value={selectedAddressId || ''}
                  onChange={handleAddressChange}
                  disabled={useNewAddress}
                >
                  {savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.name} {addr.isDefault ? '(Default)' : ''} - {truncateAddress(addr.address, 6, 4)}
                    </option>
                  ))}
                </select>
              )}
              
              <label className="use-new-address">
                <input
                  type="checkbox"
                  checked={useNewAddress}
                  onChange={handleToggleNewAddress}
                />
                Use a new address
              </label>
            </>
          )}
          
          {(useNewAddress || savedAddresses.length === 0) && (
            <input
              type="text"
              id="walletAddress"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter TRC20 wallet address"
              required
            />
          )}
          
          <Link to="/profile/saved-addresses" className="manage-addresses-link">
            Manage saved addresses
          </Link>
        </div>
        
        <button
          type="submit"
          className="submit-withdrawal"
          disabled={isLoading || !amount || !address}
        >
          {isLoading ? 'Processing...' : 'Request Withdrawal'}
        </button>
      </form>
      
      <div className="withdrawal-info">
        <h4>
          <span className="info-icon">ℹ️</span> Important Information
        </h4>
        <ul>
          <li>All withdrawal requests require admin approval and may take up to 24 hours to process.</li>
          <li>Funds will be deducted from your balance immediately upon request.</li>
          <li>Please double-check your wallet address before submitting.</li>
          <li>USDT withdrawals are only supported on the TRC20 network.</li>
        </ul>
      </div>
    </div>
  );
};

export default WithdrawalForm; 