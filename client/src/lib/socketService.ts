import { io, Socket } from 'socket.io-client';
import { create, StateCreator } from 'zustand';

// Add Vite env type definition
interface ImportMetaEnv {
  VITE_API_URL: string;
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

// Define types for received data
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

export interface SocketAuthData {
  userId: string;
  isAdmin: boolean;
}

// The state store interface
interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  connectionError: string | null;
  isConnecting: boolean;
  pendingTransactionCount: number;
  lastTransactionUpdate: TransactionUpdateData | null;
  lastDepositUpdate: DepositUpdateData | null;
  connect: () => void;
  disconnect: () => void;
  resetState: () => void;
  setPendingTransactionCount: (count: number) => void;
  incrementPendingTransactionCount: () => void;
  decrementPendingTransactionCount: () => void;
  setLastTransactionUpdate: (data: TransactionUpdateData) => void;
  setLastDepositUpdate: (data: DepositUpdateData) => void;
}

// Create a store for socket state
export const useSocketStore = create<SocketState>((set: any, get: any) => ({
  socket: null,
  isConnected: false,
  isAuthenticated: false,
  isAdmin: false,
  connectionError: null,
  isConnecting: false,
  pendingTransactionCount: 0,
  lastTransactionUpdate: null,
  lastDepositUpdate: null,

  connect: () => {
    const { socket, isConnecting } = get();

    // If already connected or connecting, do nothing
    if (socket || isConnecting) return;

    set({ isConnecting: true, connectionError: null });

    // Create a new socket connection with auth credentials
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true, // Send cookies for session authentication
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Set up event handlers
    newSocket.on(SocketEvents.CONNECT, () => {
      console.log('Socket connected');
      set({ isConnected: true, isConnecting: false, connectionError: null });
    });

    newSocket.on(SocketEvents.DISCONNECT, () => {
      console.log('Socket disconnected');
      set({ isConnected: false, isAuthenticated: false });
    });

    newSocket.on(SocketEvents.ERROR, (error) => {
      console.error('Socket error:', error);
      set({ connectionError: error.message || 'Connection error', isConnecting: false });
    });

    newSocket.on(SocketEvents.AUTHENTICATED, (data: SocketAuthData) => {
      console.log('Socket authenticated:', data);
      set({ 
        isAuthenticated: true, 
        isAdmin: data.isAdmin 
      });
    });

    newSocket.on(SocketEvents.AUTHENTICATION_ERROR, (error) => {
      console.error('Socket authentication error:', error);
      set({ 
        connectionError: 'Authentication failed', 
        isAuthenticated: false,
        isConnecting: false 
      });
    });

    // Transaction-related event handlers
    newSocket.on(SocketEvents.TRANSACTION_UPDATE, (data: TransactionUpdateData) => {
      console.log('Transaction update received:', data);
      set({ lastTransactionUpdate: data });
      
      // Update UI with transaction data
      // This will be handled by the components that use this store
    });

    newSocket.on(SocketEvents.DEPOSIT_UPDATE, (data: DepositUpdateData) => {
      console.log('Deposit update received:', data);
      set({ lastDepositUpdate: data });
      
      // Update UI with deposit data
      // This will be handled by the components that use this store
    });

    newSocket.on(SocketEvents.NEW_PENDING_TRANSACTION, (data: TransactionUpdateData) => {
      console.log('New pending transaction:', data);
      get().incrementPendingTransactionCount();
      
      // Notify admin of new pending transaction
      // This will be handled by the admin components
    });

    // Save the socket in the store
    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ 
        socket: null,
        isConnected: false,
        isAuthenticated: false,
        isAdmin: false
      });
    }
  },

  resetState: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      socket: null,
      isConnected: false,
      isAuthenticated: false,
      isAdmin: false,
      connectionError: null,
      isConnecting: false,
      pendingTransactionCount: 0,
      lastTransactionUpdate: null,
      lastDepositUpdate: null
    });
  },

  setPendingTransactionCount: (count: number) => {
    set({ pendingTransactionCount: count });
  },

  incrementPendingTransactionCount: () => {
    set((state: SocketState) => ({ 
      pendingTransactionCount: state.pendingTransactionCount + 1 
    }));
  },

  decrementPendingTransactionCount: () => {
    set((state: SocketState) => ({ 
      pendingTransactionCount: Math.max(0, state.pendingTransactionCount - 1) 
    }));
  },

  setLastTransactionUpdate: (data: TransactionUpdateData) => {
    set({ lastTransactionUpdate: data });
  },

  setLastDepositUpdate: (data: DepositUpdateData) => {
    set({ lastDepositUpdate: data });
  }
}));

// Create a custom hook for component-level socket connections
export function useSocket() {
  const socket = useSocketStore((state) => state.socket);
  const isConnected = useSocketStore((state) => state.isConnected);
  const isAuthenticated = useSocketStore((state) => state.isAuthenticated);
  const isAdmin = useSocketStore((state) => state.isAdmin);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const connectionError = useSocketStore((state) => state.connectionError);
  const pendingTransactionCount = useSocketStore((state) => state.pendingTransactionCount);
  
  return {
    socket,
    isConnected,
    isAuthenticated,
    isAdmin,
    connect,
    disconnect,
    connectionError,
    pendingTransactionCount
  };
}

// Add a helper function to get the singleton socket
export function getSocket(): Socket | null {
  return useSocketStore.getState().socket;
} 