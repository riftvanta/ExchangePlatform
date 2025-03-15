import React, { useState, useEffect } from 'react';
import { toast } from './ui/Toast';
import { useAuth } from '../context/AuthContext';

export interface SavedAddress {
  id: string;
  name: string;
  address: string;
  isDefault: boolean;
  network: string;
}

// Utility function to truncate addresses
const truncateAddress = (address: string, startChars = 8, endChars = 6) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

interface SavedAddressesManagerProps {
  onAddressesChange?: (addresses: SavedAddress[]) => void;
}

const SavedAddressesManager: React.FC<SavedAddressesManagerProps> = ({ onAddressesChange }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNetwork, setNewNetwork] = useState('TRC20');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, fetch saved addresses from the API
    // For now, we'll use mock data for demonstration
    const mockAddresses: SavedAddress[] = [
      { id: '1', name: 'My Tron Wallet', address: 'TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe', isDefault: true, network: 'TRC20' },
      { id: '2', name: 'Trading Wallet', address: 'TYGe85nX8MJQBEZ8JEMYvbB2FhxfyXfZQQ', isDefault: false, network: 'TRC20' },
    ];
    
    setAddresses(mockAddresses);
    if (onAddressesChange) {
      onAddressesChange(mockAddresses);
    }
  }, [onAddressesChange]);

  const handleAddAddress = () => {
    if (!newName.trim() || !newAddress.trim()) {
      toast.error('Please enter both name and address');
      return;
    }

    // In a real implementation, call API to save the new address
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const newAddressList = [
        ...addresses,
        {
          id: Date.now().toString(),
          name: newName,
          address: newAddress,
          isDefault: addresses.length === 0, // First address becomes default
          network: newNetwork
        }
      ];
      
      setAddresses(newAddressList);
      if (onAddressesChange) {
        onAddressesChange(newAddressList);
      }
      
      setNewName('');
      setNewAddress('');
      setIsLoading(false);
      
      toast.success('Withdrawal address added successfully!');
    }, 500);
  };

  const handleEditAddress = (id: string) => {
    setIsEditing(id);
    const addressToEdit = addresses.find(addr => addr.id === id);
    if (addressToEdit) {
      setNewName(addressToEdit.name);
      setNewAddress(addressToEdit.address);
      setNewNetwork(addressToEdit.network);
    }
  };

  const handleUpdateAddress = () => {
    if (!newName.trim() || !newAddress.trim() || !isEditing) {
      toast.error('Please enter both name and address');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const updatedAddresses = addresses.map(addr => 
        addr.id === isEditing 
          ? { ...addr, name: newName, address: newAddress, network: newNetwork }
          : addr
      );
      
      setAddresses(updatedAddresses);
      if (onAddressesChange) {
        onAddressesChange(updatedAddresses);
      }
      
      setNewName('');
      setNewAddress('');
      setIsEditing(null);
      setIsLoading(false);
      
      toast.success('Withdrawal address updated successfully!');
    }, 500);
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setIsLoading(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        const updatedAddresses = addresses.filter(addr => addr.id !== id);
        
        // If we deleted the default address, make the first remaining address the default
        if (addresses.find(addr => addr.id === id)?.isDefault && updatedAddresses.length > 0) {
          updatedAddresses[0].isDefault = true;
        }
        
        setAddresses(updatedAddresses);
        if (onAddressesChange) {
          onAddressesChange(updatedAddresses);
        }
        
        setIsLoading(false);
        toast.success('Withdrawal address deleted successfully!');
      }, 500);
    }
  };

  const handleSetDefault = (id: string) => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      
      setAddresses(updatedAddresses);
      if (onAddressesChange) {
        onAddressesChange(updatedAddresses);
      }
      
      setIsLoading(false);
      toast.success('Default withdrawal address updated!');
    }, 500);
  };

  // Function to copy address to clipboard
  const copyToClipboard = (address: string, name: string) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        toast.success(`Address for ${name} copied to clipboard`);
      })
      .catch(() => {
        toast.error('Failed to copy address');
      });
  };

  return (
    <div className="saved-addresses-manager">
      <h3 className="section-title">Manage Withdrawal Addresses</h3>
      
      <div className="address-list">
        {addresses.length === 0 ? (
          <p className="no-addresses">No saved addresses. Add your first withdrawal address.</p>
        ) : (
          <table className="addresses-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Network</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addresses.map(address => (
                <tr key={address.id} className={address.isDefault ? 'default-address' : ''}>
                  <td>{address.name}</td>
                  <td className="address-cell">
                    <span 
                      className="truncated-address" 
                      title={`Click to copy: ${address.address}`}
                      onClick={() => copyToClipboard(address.address, address.name)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          copyToClipboard(address.address, address.name);
                        }
                      }}
                    >
                      {truncateAddress(address.address)}
                    </span>
                  </td>
                  <td>{address.network}</td>
                  <td>
                    {address.isDefault ? (
                      <span className="default-badge">Default</span>
                    ) : (
                      <button 
                        className="set-default-btn"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={isLoading}
                      >
                        Set Default
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="address-actions">
                      <button 
                        className="edit-address-btn"
                        onClick={() => handleEditAddress(address.id)}
                        disabled={isLoading}
                        aria-label={`Edit ${address.name}`}
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-address-btn"
                        onClick={() => handleDeleteAddress(address.id)}
                        disabled={isLoading}
                        aria-label={`Delete ${address.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="add-address-form">
        <h4>{isEditing ? 'Edit Address' : 'Add New Address'}</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address-name">Address Name</label>
            <input
              type="text"
              id="address-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., My Main Wallet"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="network-type">Network</label>
            <select
              id="network-type"
              value={newNetwork}
              onChange={(e) => setNewNetwork(e.target.value)}
              className="form-select"
              disabled={isLoading}
            >
              <option value="TRC20">TRC20 (Tron)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
              <option value="BEP20">BEP20 (BSC)</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="wallet-address">Wallet Address</label>
          <input
            type="text"
            id="wallet-address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="form-input"
            disabled={isLoading}
          />
        </div>
        
        <div className="address-form-buttons">
          {isEditing ? (
            <>
              <button 
                className="update-address-btn"
                onClick={handleUpdateAddress}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Address"}
              </button>
              <button 
                className="cancel-edit-btn"
                onClick={() => {
                  setIsEditing(null);
                  setNewName('');
                  setNewAddress('');
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              className="add-address-btn"
              onClick={handleAddAddress}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Address"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedAddressesManager; 