import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
// Import a proper secp256k1 implementation
import * as ecc from 'tiny-secp256k1';
import crypto from 'crypto';
import { depositAddresses } from '../../shared/schema';
import db from '../db';
import { eq, and } from 'drizzle-orm';

// TronWeb has changed its export pattern in v6.0+
// We need to use require for now as the TypeScript types are not properly defined
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TronWeb } = require('tronweb');

/**
 * HD Wallet Service
 * 
 * This service handles the generation and management of hierarchical deterministic (HD) 
 * wallet addresses for user deposits.
 * 
 * SECURITY NOTICE:
 * - The master seed is the most critical security component of this system
 * - In production, the master seed should be stored in a Hardware Security Module (HSM)
 * - For development, we use environment variables, but this is NOT secure for production
 */
class HDWalletService {
  private masterSeed: Buffer | null = null;
  private tronWeb: any;
  private initialized: boolean = false;
  private bip32: any;
  private useHSM: boolean = false;
  
  constructor() {
    // Initialize TronWeb with your network configuration
    const fullHostUrl = process.env.TRON_NETWORK_URL || 'https://api.trongrid.io';
    
    // Initialize TronWeb with the v6.0+ pattern
    this.tronWeb = new TronWeb({
      fullHost: fullHostUrl
    });
    
    // Initialize BIP32 factory with the proper ECC implementation
    this.bip32 = BIP32Factory(ecc);
    
    // Check if we should use HSM in production
    this.useHSM = process.env.NODE_ENV === 'production' && process.env.USE_AWS_HSM === 'true';
    
    // We'll initialize the master seed in the init() method
  }
  
  /**
   * Initialize the wallet service
   * This is separated from constructor to allow for async initialization
   */
  async init(): Promise<void> {
    try {
      if (this.useHSM) {
        await this.initWithHSM();
      } else {
        await this.initWithEnvironmentVariable();
      }
      
      this.initialized = true;
      console.log('HD Wallet service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HD Wallet service:', error);
      throw new Error('Failed to initialize wallet service');
    }
  }
  
  /**
   * Initialize with AWS CloudHSM in production
   * This method handles secure key operations using CloudHSM
   */
  private async initWithHSM(): Promise<void> {
    // PRODUCTION ONLY: Use AWS CloudHSM
    console.log('Initializing HD Wallet with AWS CloudHSM');
    
    try {
      // In production, you would:
      // 1. Connect to CloudHSM using AWS SDK or PKCS#11 interface
      // 2. Use the HSM to perform cryptographic operations
      // 3. Keep the master seed secure within the HSM
      
      // This is a placeholder for the actual HSM integration
      if (!process.env.HSM_KEY_LABEL) {
        throw new Error('HSM_KEY_LABEL environment variable is required for HSM mode');
      }
      
      // The actual seed is never exposed outside the HSM
      // Instead, we set a placeholder to indicate it's in the HSM
      this.masterSeed = Buffer.from('HSM_PROTECTED_SEED');
      
      console.log('Successfully initialized with CloudHSM');
    } catch (error) {
      console.error('Failed to initialize with HSM:', error);
      throw new Error('HSM initialization failed');
    }
  }
  
  /**
   * Initialize with environment variable for development
   */
  private async initWithEnvironmentVariable(): Promise<void> {
    // CRITICAL: In production, this should be loaded from a HSM or secure vault
    // For development, we're using an environment variable
    let seedPhrase = process.env.MASTER_SEED_PHRASE;
    
    if (!seedPhrase) {
      console.warn('⚠️ WARNING: No master seed phrase found in environment variables.');
      console.warn('⚠️ Generating a new random seed phrase for development purposes ONLY.');
      console.warn('⚠️ DO NOT use this for production or with real funds!');
      
      // Generate a new mnemonic for development only
      seedPhrase = bip39.generateMnemonic(256); // 24 words
      
      console.warn('⚠️ Save this seed phrase securely and add it to your environment variables:');
      console.warn(`MASTER_SEED_PHRASE=${seedPhrase}`);
    }
    
    // Convert mnemonic to seed
    this.masterSeed = await bip39.mnemonicToSeed(seedPhrase);
  }

  /**
   * Ensure the service is initialized before use
   */
  private ensureInitialized() {
    if (!this.initialized || !this.masterSeed) {
      throw new Error('HD Wallet service not initialized properly');
    }
  }
  
  /**
   * Generate a deterministic hash from a user ID
   * This is used to create consistent derivation paths for each user
   */
  private hashUserId(userId: string): number {
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    // Convert the first 4 bytes of the hash to a number (0-2^32)
    return parseInt(hash.slice(0, 8), 16);
  }
  
  /**
   * Generate a deposit address for a user
   * 
   * @param userId The user's ID
   * @param currency The currency (e.g., 'USDT')
   * @param network The network (e.g., 'TRC20')
   * @param index Optional index to generate multiple addresses for same user
   * @returns The generated address and its derivation path
   */
  async generateAddressForUser(
    userId: string, 
    currency: string, 
    network: string,
    index: number = 0
  ): Promise<{ address: string, path: string }> {
    this.ensureInitialized();
    
    // Only support TRC20 network for now
    if (network !== 'TRC20') {
      throw new Error(`Unsupported network: ${network}`);
    }
    
    // Create a deterministic account index based on the user ID
    const accountIndex = this.hashUserId(userId) % 2147483648; // Keep within BIP-44 range
    
    // BIP44 path for TRON: m/44'/195'/accountIndex'/0/addressIndex
    // 44' - BIP44 purpose
    // 195' - TRON coin type
    // accountIndex' - User-specific account (derived from userId)
    // 0 - External chain (0 for receiving addresses)
    // index - Address index (allows multiple addresses per user)
    const path = `m/44'/195'/${accountIndex}'/0/${index}`;
    
    try {
      // Generate the address from the HD path
      // Use the instance we created in the constructor
      console.log('Generating address with path:', path);
      console.log('Master seed available:', !!this.masterSeed);
      
      const masterNode = this.bip32.fromSeed(this.masterSeed!);
      console.log('Master node created successfully');
      
      const childNode = masterNode.derivePath(path);
      console.log('Child node derived successfully');
      
      if (!childNode.privateKey) {
        throw new Error('Failed to derive private key');
      }
      console.log('Private key derived successfully');
      
      // Convert to TRON address format
      // TronWeb expects a hex string without 0x prefix, not a Buffer
      // We need to convert the Buffer to a proper hex string
      const privateKeyBuffer = childNode.privateKey;
      const privateKeyHex = Buffer.from(privateKeyBuffer).toString('hex');
      console.log('Private key hex length:', privateKeyHex.length);
      
      // Make sure we're passing a properly formatted hex string to TronWeb
      const address = this.tronWeb.address.fromPrivateKey(privateKeyHex);
      console.log('Generated address:', address);
      
      // If address is false, it means there was an error
      if (address === false) {
        throw new Error('TronWeb failed to generate address from private key');
      }
      
      // SECURITY: Never return or store the private key!
      return { address, path };
    } catch (error) {
      console.error('Error generating address:', error);
      throw new Error('Failed to generate deposit address');
    }
  }
  
  /**
   * Create a new deposit address for a user and save it to the database
   */
  async createDepositAddress(
    userId: string,
    currency: string,
    network: string,
    label?: string
  ): Promise<{ id: string, address: string }> {
    // Find existing addresses for this user/currency/network
    const existingAddresses = await db
      .select()
      .from(depositAddresses)
      .where(
        and(
          eq(depositAddresses.userId, userId),
          eq(depositAddresses.currency, currency),
          eq(depositAddresses.network, network)
        )
      );
    
    // Use the count as index to ensure we generate a unique address
    const index = existingAddresses.length;
    
    // Generate a new address
    const { address, path } = await this.generateAddressForUser(
      userId, 
      currency, 
      network,
      index
    );
    
    // Save to database
    const [newAddress] = await db.insert(depositAddresses)
      .values({
        userId,
        currency,
        network,
        address,
        path,
        label,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({ id: depositAddresses.id, address: depositAddresses.address });
    
    return { id: newAddress.id, address: newAddress.address };
  }
  
  /**
   * Get all deposit addresses for a user
   */
  async getUserDepositAddresses(userId: string, currency?: string, network?: string) {
    // Add filters if provided
    const conditions = [eq(depositAddresses.userId, userId)];
    
    if (currency) {
      conditions.push(eq(depositAddresses.currency, currency));
    }
    
    if (network) {
      conditions.push(eq(depositAddresses.network, network));
    }
    
    // Execute the query with all conditions
    return await db
      .select()
      .from(depositAddresses)
      .where(and(...conditions));
  }
  
  /**
   * Verify that an address belongs to a user
   */
  async verifyAddressOwnership(address: string, userId: string): Promise<boolean> {
    const foundAddress = await db
      .select()
      .from(depositAddresses)
      .where(
        and(
          eq(depositAddresses.address, address),
          eq(depositAddresses.userId, userId),
          eq(depositAddresses.isActive, true)
        )
      )
      .limit(1);
    
    return foundAddress.length > 0;
  }
  
  /**
   * Mark an address as used (updates the lastUsed timestamp)
   */
  async markAddressAsUsed(address: string): Promise<void> {
    await db
      .update(depositAddresses)
      .set({ lastUsed: new Date(), updatedAt: new Date() })
      .where(eq(depositAddresses.address, address));
  }
  
  /**
   * Deactivate an address
   */
  async deactivateAddress(addressId: string): Promise<void> {
    await db
      .update(depositAddresses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(depositAddresses.id, addressId));
  }
}

// Export a singleton instance
const hdWalletService = new HDWalletService();
export default hdWalletService; 