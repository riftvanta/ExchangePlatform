// Test script for TronWeb address generation

// Import TronWeb with v6.0+ syntax
const { TronWeb } = require('tronweb');

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io'
});

// Test private key (for testing only, never use in production)
const privateKey = '0000000000000000000000000000000000000000000000000000000000000001';

try {
  // Try to generate an address from the private key
  console.log('Attempting to generate address from private key...');
  const address = tronWeb.address.fromPrivateKey(privateKey);
  console.log('Generated address:', address);
  
  // Check if the address is valid
  const isValid = tronWeb.isAddress(address);
  console.log('Is valid address:', isValid);
  
  // Print TronWeb version
  console.log('TronWeb version:', require('tronweb/package.json').version);
} catch (error) {
  console.error('Error generating address:', error);
} 