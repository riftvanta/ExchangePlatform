import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import session from 'express-session';
import { AuthenticationError } from '../../shared/errors';
import { IncomingMessage } from 'http';

// Extend the IncomingMessage type to include session
interface SessionIncomingMessage extends IncomingMessage {
  session: session.Session & {
    userId?: string;
    isAdmin?: boolean;
  };
}

// Define event types for better type safety
export enum SocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  TRANSACTION_UPDATE = 'transaction:update',
  DEPOSIT_UPDATE = 'deposit:update',
  NEW_PENDING_TRANSACTION = 'admin:new-pending-transaction',
  AUTHENTICATED = 'authenticated',
  AUTHENTICATION_ERROR = 'authentication_error'
}

// Define types for emitted data
export interface TransactionUpdateData {
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  type: 'deposit' | 'withdrawal';
  amount: string;
  currency: string;
  updatedAt: Date;
  rejectionReason?: string;
}

export interface DepositUpdateData {
  transactionId: string;
  walletId: string;
  amount: string;
  currency: string;
  status: string;
  detectedAt: Date;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  isAdmin?: boolean;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();
  private adminSockets: Set<string> = new Set();

  /**
   * Initialize the Socket.IO server
   * @param httpServer The HTTP server instance
   * @param sessionMiddleware Express session middleware
   */
  init(httpServer: HttpServer, sessionMiddleware: ReturnType<typeof session>) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Apply session middleware to Socket.IO
    this.io.use((socket: AuthenticatedSocket, next) => {
      // Convert middleware to Socket.IO middleware
      const expressMiddlewareWrapper = (req: any, res: any, nextFn: any) => {
        sessionMiddleware(req, res, nextFn);
      };

      expressMiddlewareWrapper(socket.request, {}, next);
    });

    // Authenticate socket connections
    this.io.use((socket: AuthenticatedSocket, next) => {
      const session = (socket.request as SessionIncomingMessage).session;

      // Check if user is authenticated
      if (!session || !session.userId) {
        return next(new AuthenticationError());
      }

      // Add user ID to socket for later use
      socket.userId = session.userId;
      
      // Check if user is admin (if session has admin flag)
      if (session.isAdmin) {
        socket.isAdmin = true;
      }

      next();
    });

    // Handle connections
    this.io.on(SocketEvents.CONNECT, (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      // Add socket to user map
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)?.add(socket.id);

        // Add admin sockets to admin set
        if (socket.isAdmin) {
          this.adminSockets.add(socket.id);
        }

        // Emit authenticated event to client
        socket.emit(SocketEvents.AUTHENTICATED, { 
          userId: socket.userId,
          isAdmin: socket.isAdmin 
        });
      }

      // Handle disconnections
      socket.on(SocketEvents.DISCONNECT, () => {
        console.log(`User disconnected: ${socket.userId}`);
        
        // Remove socket from user map
        if (socket.userId && this.userSockets.has(socket.userId)) {
          this.userSockets.get(socket.userId)?.delete(socket.id);
          
          // Clean up empty sets
          if (this.userSockets.get(socket.userId)?.size === 0) {
            this.userSockets.delete(socket.userId);
          }
        }
        
        // Remove from admin set if applicable
        if (socket.isAdmin) {
          this.adminSockets.delete(socket.id);
        }
      });
    });

    console.log('Socket.IO service initialized');
  }

  /**
   * Emit a transaction update to a specific user
   * @param userId The user ID to send the update to
   * @param data The transaction update data
   */
  emitTransactionUpdate(userId: string, data: TransactionUpdateData) {
    if (!this.io) return;
    
    // Get all socket IDs for this user
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds && socketIds.size > 0) {
      // Emit event to all user's sockets
      socketIds.forEach(socketId => {
        this.io?.to(socketId).emit(SocketEvents.TRANSACTION_UPDATE, data);
      });
      console.log(`Transaction update emitted to user ${userId}`);
    }
  }

  /**
   * Emit a deposit update to a specific user
   * @param userId The user ID to send the update to
   * @param data The deposit update data
   */
  emitDepositUpdate(userId: string, data: DepositUpdateData) {
    if (!this.io) return;
    
    // Get all socket IDs for this user
    const socketIds = this.userSockets.get(userId);
    
    if (socketIds && socketIds.size > 0) {
      // Emit event to all user's sockets
      socketIds.forEach(socketId => {
        this.io?.to(socketId).emit(SocketEvents.DEPOSIT_UPDATE, data);
      });
      console.log(`Deposit update emitted to user ${userId}`);
    }
  }

  /**
   * Emit a notification about a new pending transaction to all admins
   * @param data The transaction data
   */
  emitNewPendingTransaction(data: TransactionUpdateData) {
    if (!this.io) return;
    
    // Emit to all admin sockets
    this.adminSockets.forEach(socketId => {
      this.io?.to(socketId).emit(SocketEvents.NEW_PENDING_TRANSACTION, data);
    });
    
    console.log(`New pending transaction notification emitted to ${this.adminSockets.size} admins`);
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

// Singleton instance
export default new SocketService(); 