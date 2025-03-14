// Test script for TronWeb address generation with detailed debugging

// Import TronWeb with v6.0+ syntax
const { TronWeb } = require('tronweb');

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io'
});

// Test with a known valid private key (for testing only, never use in production)
const privateKey = '3481E79956D4BD95F358AC96D151C976392FC4E3FC132F78A847906DE588C145';

console.log('Testing with private key:', privateKey);
console.log('Private key type:', typeof privateKey);
console.log('Private key length:', privateKey.length);

try {
  // Try to generate an address from the private key
  console.log('Attempting to generate address from private key...');
  const address = tronWeb.address.fromPrivateKey(privateKey);
  console.log('Generated address:', address);
  
  // Check if the address is valid
  const isValid = tronWeb.isAddress(address);
  console.log('Is valid address:', isValid);
  
  // Try with a different format
  console.log('\nTrying with Buffer format...');
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
  console.log('Private key buffer:', privateKeyBuffer);
  const addressFromBuffer = tronWeb.address.fromPrivateKey(privateKeyBuffer);
  console.log('Generated address from buffer:', addressFromBuffer);
  
  // Try with a different private key
  console.log('\nTrying with a different private key...');
  const anotherPrivateKey = '0000000000000000000000000000000000000000000000000000000000000001';
  const anotherAddress = tronWeb.address.fromPrivateKey(anotherPrivateKey);
  console.log('Generated address from another key:', anotherAddress);
  
} catch (error) {
  console.error('Error generating address:', error);
} 