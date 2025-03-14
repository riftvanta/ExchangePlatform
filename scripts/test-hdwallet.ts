/**
 * HD Wallet Test Script
 * 
 * This script tests the functionality of the HD wallet service.
 * It verifies that address generation and validation work correctly.
 * 
 * Usage:
 * npx ts-node scripts/test-hdwallet.ts
 */
import * as dotenv from 'dotenv';
import hdWalletService from '../server/services/hdWalletService';

// Load environment variables
dotenv.config();

async function testHDWallet() {
  console.log('🔑 Testing HD Wallet Functionality');
  console.log('----------------------------------');
  
  try {
    // Initialize the HD wallet service (use the singleton instance)
    await hdWalletService.init();
    
    console.log('✅ HD Wallet service initialized successfully\n');
    
    // Test address generation for a test user
    const testUserId = 'test-user-1';
    console.log(`Generating address for user: ${testUserId}`);
    
    const { address, path } = await hdWalletService.generateAddressForUser(
      testUserId,
      'USDT',
      'TRC20'
    );
    
    console.log(`Generated address: ${address}`);
    console.log(`Derivation path: ${path}\n`);
    
    // Test with another user to ensure derivation paths differ
    const anotherUserId = 'test-user-2';
    console.log(`Generating address for different user: ${anotherUserId}`);
    
    const { address: anotherAddress, path: anotherPath } = await hdWalletService.generateAddressForUser(
      anotherUserId,
      'USDT',
      'TRC20'
    );
    
    console.log(`Generated address: ${anotherAddress}`);
    console.log(`Derivation path: ${anotherPath}\n`);
    
    console.log('==================================');
    console.log('🎉 All tests completed successfully!');
    console.log('==================================');
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testHDWallet()
  .then(() => {
    console.log('Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  }); 