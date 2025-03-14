import { depositAddresses, transactions, wallets } from '../../shared/schema';
import db from '../db';
import { eq, and, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import socketService from './socketService';

// Import TronWeb with v6.0+ syntax
import { TronWeb } from 'tronweb';

// USDT contract address on TRON network
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // Mainnet USDT

class DepositMonitorService {
  private tronWeb: any;
  private isRunning: boolean;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs: number;
  
  constructor(checkIntervalMs = 60000) { // Default: check every minute
    const fullHostUrl = process.env.TRON_NETWORK_URL || 'https://api.trongrid.io';
    
    // Initialize TronWeb with v6.0+ pattern
    this.tronWeb = new TronWeb({
      fullHost: fullHostUrl
    });
    
    this.isRunning = false;
    this.checkIntervalMs = checkIntervalMs;
  }
  
  /**
   * Start the deposit monitoring service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Deposit monitor service is already running');
      return;
    }
    
    console.log('Starting deposit monitor service...');
    this.isRunning = true;
    
    // Perform an initial check immediately
    this.checkForNewDeposits().catch(error => {
      console.error('Error during initial deposit check:', error);
    });
    
    // Set up regular interval checks
    this.checkIntervalId = setInterval(() => {
      this.checkForNewDeposits().catch(error => {
        console.error('Error checking for deposits:', error);
      });
    }, this.checkIntervalMs);
    
    console.log(`Deposit monitor service started. Checking every ${this.checkIntervalMs / 1000} seconds.`);
  }
  
  /**
   * Stop the deposit monitoring service
   */
  stop(): void {
    if (!this.isRunning || !this.checkIntervalId) {
      console.log('Deposit monitor service is not running');
      return;
    }
    
    clearInterval(this.checkIntervalId);
    this.checkIntervalId = null;
    this.isRunning = false;
    console.log('Deposit monitor service stopped');
  }
  
  /**
   * Get a list of all active deposit addresses to monitor
   */
  private async getActiveAddresses(): Promise<Array<{ 
    id: string, 
    userId: string, 
    address: string, 
    currency: string
  }>> {
    return await db
      .select({
        id: depositAddresses.id,
        userId: depositAddresses.userId,
        address: depositAddresses.address,
        currency: depositAddresses.currency
      })
      .from(depositAddresses)
      .where(eq(depositAddresses.isActive, true));
  }
  
  /**
   * Get transactions that have been processed for a given address
   * This helps avoid double-processing the same transaction
   */
  private async getProcessedTransactions(address: string): Promise<string[]> {
    const records = await db
      .select({ txHash: transactions.transactionHash })
      .from(transactions)
      .where(
        and(
          eq(transactions.depositAddress, address),
          eq(transactions.status, 'completed')
        )
      );
    
    return records.map(r => r.txHash);
  }
  
  /**
   * Check for new TRC20 token transfers to an address
   */
  private async checkTrc20Transfers(
    address: string, 
    processedTxHashes: string[],
    contractAddress = USDT_CONTRACT_ADDRESS
  ): Promise<Array<{
    txHash: string;
    amount: string;
    timestamp: number;
  }>> {
    try {
      // Get the events from the Tron network
      // Note: This is a simplified example, you'll need to use the 
      // appropriate TronWeb API to get token transfers
      const events = await this.tronWeb.getEventResult(
        contractAddress,
        {
          eventName: 'Transfer',
          onlyConfirmed: true,
          sinceTimestamp: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
          filters: [{ _to: address }]
        }
      );
      
      // Filter out already processed transactions
      return events
        .filter((event: any) => !processedTxHashes.includes(event.transaction))
        .map((event: any) => ({
          txHash: event.transaction,
          amount: this.tronWeb.fromSun(event._value), // Convert from SUN to TRX
          timestamp: event.timestamp,
        }));
    } catch (error) {
      console.error(`Error checking TRC20 transfers for ${address}:`, error);
      return [];
    }
  }
  
  /**
   * Process a deposit and create a transaction record
   */
  async processDeposit(
    userId: string,
    address: string,
    txHash: string,
    amount: string,
    currency: string
  ): Promise<void> {
    try {
      // Check if this transaction was already processed
      const existingTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.transactionHash, txHash));
      
      if (existingTransactions.length > 0) {
        console.log(`Transaction ${txHash} already processed, skipping`);
        return;
      }
      
      // Create transaction record in the DB
      await db.transaction(async (tx) => {
        // Get the user's wallet for this currency
        const userWallets = await tx
          .select()
          .from(wallets)
          .where(
            and(
              eq(wallets.userId, userId),
              eq(wallets.currency, currency)
            )
          );
        
        // If wallet not found, log error and exit
        if (userWallets.length === 0) {
          console.error(`No ${currency} wallet found for user ${userId}`);
          return;
        }
        
        const wallet = userWallets[0];
        const transactionId = uuidv4();
        
        // Create new transaction record with a pending status
        await tx.insert(transactions).values({
          id: transactionId,
          userId,
          walletId: wallet.id,
          type: 'deposit',
          status: 'pending',
          amount,
          currency,
          depositAddress: address,
          transactionHash: txHash,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`Created pending deposit transaction for user: ${userId}, amount: ${amount} ${currency}`);
        
        // Emit real-time update via Socket.IO
        socketService.emitDepositUpdate(userId, {
          transactionId,
          walletId: wallet.id,
          amount,
          currency,
          status: 'pending',
          detectedAt: new Date()
        });
        
        // Emit notification to admins about new pending transaction
        socketService.emitNewPendingTransaction({
          transactionId,
          status: 'pending',
          type: 'deposit',
          amount,
          currency,
          updatedAt: new Date()
        });
      });
    } catch (error) {
      console.error('Error processing deposit:', error);
      throw error;
    }
  }
  
  /**
   * Check for new deposits to all active addresses
   */
  async checkForNewDeposits(): Promise<void> {
    if (!this.isRunning) {
      console.warn('Attempt to check deposits while service is stopped');
      return;
    }
    
    try {
      console.log('Checking for new deposits...');
      const activeAddresses = await this.getActiveAddresses();
      
      if (activeAddresses.length === 0) {
        console.log('No active deposit addresses to monitor');
        return;
      }
      
      console.log(`Monitoring ${activeAddresses.length} active deposit addresses`);
      
      // For each active address, check for new deposits
      for (const { id, userId, address, currency } of activeAddresses) {
        if (currency !== 'USDT') {
          continue; // Skip non-USDT addresses for now
        }
        
        // Get already processed transactions to avoid duplicates
        const processedTxHashes = await this.getProcessedTransactions(address);
        
        // Check for new TRC20 transfers
        const newTransfers = await this.checkTrc20Transfers(address, processedTxHashes);
        
        // Process each new transfer
        for (const { txHash, amount } of newTransfers) {
          console.log(`New deposit detected: ${amount} USDT to address ${address} (tx: ${txHash})`);
          
          await this.processDeposit(
            userId,
            address,
            txHash,
            amount,
            'USDT'
          );
          
          // Update the lastUsed timestamp for the deposit address
          await db
            .update(depositAddresses)
            .set({ 
              lastUsed: new Date(),
              updatedAt: new Date()
            })
            .where(eq(depositAddresses.id, id));
        }
      }
      
      console.log('Deposit check completed');
    } catch (error) {
      console.error('Error in deposit monitor service:', error);
    }
  }
}

// Export a singleton instance
const depositMonitorService = new DepositMonitorService();
export default depositMonitorService; 