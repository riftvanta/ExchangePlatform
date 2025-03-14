import { Router, Request, Response, RequestHandler } from 'express';
import hdWalletService from '../services/hdWalletService';
import { isAuthenticated } from '../middleware/isAuthenticated';

const router = Router();

/**
 * Get all deposit addresses for the authenticated user
 */
router.get('/', isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as string;
    const { currency, network } = req.query;
    
    const addresses = await hdWalletService.getUserDepositAddresses(
      userId,
      currency as string | undefined,
      network as string | undefined
    );
    
    res.status(200).json({ addresses });
  } catch (error) {
    console.error('Error fetching deposit addresses:', error);
    res.status(500).json({ error: 'Failed to fetch deposit addresses' });
  }
}) as RequestHandler);

/**
 * Create a new deposit address for the authenticated user
 */
router.post('/', isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as string;
    const { currency, network, label } = req.body;
    
    // Validate required fields
    if (!currency || !network) {
      return res.status(400).json({ 
        error: 'Currency and network are required' 
      });
    }
    
    // For now, we only support USDT on TRC20
    if (currency !== 'USDT' || network !== 'TRC20') {
      return res.status(400).json({ 
        error: 'Only USDT on TRC20 network is supported' 
      });
    }
    
    // Create new deposit address
    const newAddress = await hdWalletService.createDepositAddress(
      userId, 
      currency, 
      network,
      label
    );
    
    res.status(201).json({ 
      message: 'Deposit address created successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('Error creating deposit address:', error);
    res.status(500).json({ error: 'Failed to create deposit address' });
  }
}) as RequestHandler);

/**
 * Verify ownership of a deposit address
 */
router.get('/verify/:address', isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId as string;
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const isOwner = await hdWalletService.verifyAddressOwnership(address, userId);
    
    res.status(200).json({ isOwner });
  } catch (error) {
    console.error('Error verifying address ownership:', error);
    res.status(500).json({ error: 'Failed to verify address ownership' });
  }
}) as RequestHandler);

/**
 * Deactivate a deposit address
 */
router.post('/:id/deactivate', isAuthenticated, (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Address ID is required' });
    }
    
    await hdWalletService.deactivateAddress(id);
    
    res.status(200).json({ 
      message: 'Address deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deactivating address:', error);
    res.status(500).json({ error: 'Failed to deactivate address' });
  }
}) as RequestHandler);

export default router; 