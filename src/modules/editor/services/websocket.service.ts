import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { collaborationService } from './collaboration.service';
import { richEditorService } from './rich-editor.service';
import { IEditorOperation } from './rich-editor.service';

export interface ISocketUser {
  userId: string;
  userName: string;
  socketId: string;
}

export interface IEditorEvent {
  type: 'operation' | 'cursor' | 'selection' | 'join' | 'leave';
  recordId: string;
  userId: string;
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ISocketUser> = new Map();
  private recordSessions: Map<string, Set<string>> = new Map(); // recordId -> socketIds

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupCollaborationListeners();
  }

  // Setup authentication middleware
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        socket.data.userId = decoded.userId;
        socket.data.userName = decoded.userName || decoded.email;
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  // Setup main event handlers
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.data.userId} (${socket.id})`);

      // Store connected user
      this.connectedUsers.set(socket.id, {
        userId: socket.data.userId,
        userName: socket.data.userName,
        socketId: socket.id
      });

      // Handle joining a record editing session
      socket.on('join-record', async (data: { recordId: string }) => {
        try {
          const { recordId } = data;
          
          // Join socket room for this record
          await socket.join(`record:${recordId}`);
          
          // Add to record session tracking
          if (!this.recordSessions.has(recordId)) {
            this.recordSessions.set(recordId, new Set());
          }
          this.recordSessions.get(recordId)!.add(socket.id);

          // Join collaboration session
          const session = await collaborationService.joinSession(
            recordId,
            socket.data.userId,
            socket.data.userName
          );

          // Notify other participants
          socket.to(`record:${recordId}`).emit('user-joined', {
            userId: socket.data.userId,
            userName: socket.data.userName,
            timestamp: Date.now()
          });

          // Send current session state to new participant
          socket.emit('session-state', {
            participants: session.participants,
            version: session.version,
            operations: session.operations.slice(-50) // Last 50 operations
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to join record session' });
        }
      });

      // Handle leaving a record editing session
      socket.on('leave-record', async (data: { recordId: string }) => {
        try {
          const { recordId } = data;
          
          await socket.leave(`record:${recordId}`);
          
          // Remove from record session tracking
          this.recordSessions.get(recordId)?.delete(socket.id);
          if (this.recordSessions.get(recordId)?.size === 0) {
            this.recordSessions.delete(recordId);
          }

          // Leave collaboration session
          await collaborationService.leaveSession(recordId, socket.data.userId);

          // Notify other participants
          socket.to(`record:${recordId}`).emit('user-left', {
            userId: socket.data.userId,
            timestamp: Date.now()
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to leave record session' });
        }
      });

      // Handle editor operations
      socket.on('editor-operation', async (data: {
        recordId: string;
        operation: IEditorOperation;
      }) => {
        try {
          const { recordId, operation } = data;
          
          // Apply operation with operational transformation
          const result = await collaborationService.applyOperation(recordId, {
            ...operation,
            userId: socket.data.userId,
            timestamp: Date.now()
          });

          // Apply the operation to the actual content
          await this.applyOperationToContent(recordId, result.operation);

          // Broadcast transformed operation to other participants
          socket.to(`record:${recordId}`).emit('operation-applied', {
            operation: result.transformedOperation,
            userId: socket.data.userId,
            timestamp: Date.now()
          });

          // Send acknowledgment to sender
          socket.emit('operation-acknowledged', {
            operationId: operation.timestamp,
            transformedOperation: result.transformedOperation,
            conflicts: result.conflicts
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to apply operation' });
        }
      });

      // Handle cursor updates
      socket.on('cursor-update', async (data: {
        recordId: string;
        blockId: string;
        position: number;
      }) => {
        try {
          const { recordId, blockId, position } = data;
          
          await collaborationService.updateCursor(recordId, {
            userId: socket.data.userId,
            blockId,
            position,
            timestamp: Date.now()
          });

          // Broadcast cursor position to other participants
          socket.to(`record:${recordId}`).emit('cursor-updated', {
            userId: socket.data.userId,
            userName: socket.data.userName,
            blockId,
            position,
            timestamp: Date.now()
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to update cursor' });
        }
      });

      // Handle selection updates
      socket.on('selection-update', async (data: {
        recordId: string;
        blockId: string;
        start: number;
        end: number;
      }) => {
        try {
          const { recordId, blockId, start, end } = data;
          
          await collaborationService.updateSelection(recordId, {
            userId: socket.data.userId,
            blockId,
            start,
            end,
            timestamp: Date.now()
          });

          // Broadcast selection to other participants
          socket.to(`record:${recordId}`).emit('selection-updated', {
            userId: socket.data.userId,
            userName: socket.data.userName,
            blockId,
            start,
            end,
            timestamp: Date.now()
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to update selection' });
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { recordId: string; blockId: string }) => {
        socket.to(`record:${data.recordId}`).emit('user-typing', {
          userId: socket.data.userId,
          userName: socket.data.userName,
          blockId: data.blockId,
          isTyping: true
        });
      });

      socket.on('typing-stop', (data: { recordId: string; blockId: string }) => {
        socket.to(`record:${data.recordId}`).emit('user-typing', {
          userId: socket.data.userId,
          userName: socket.data.userName,
          blockId: data.blockId,
          isTyping: false
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.data.userId} (${socket.id})`);
        
        // Clean up user from all record sessions
        for (const [recordId, socketIds] of this.recordSessions.entries()) {
          if (socketIds.has(socket.id)) {
            socketIds.delete(socket.id);
            
            // Leave collaboration session
            await collaborationService.leaveSession(recordId, socket.data.userId);
            
            // Notify other participants
            socket.to(`record:${recordId}`).emit('user-left', {
              userId: socket.data.userId,
              timestamp: Date.now()
            });
            
            if (socketIds.size === 0) {
              this.recordSessions.delete(recordId);
            }
          }
        }

        // Remove from connected users
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  // Setup collaboration service event listeners
  private setupCollaborationListeners(): void {
    collaborationService.on('user-joined', (event) => {
      this.io.to(`record:${event.recordId}`).emit('collaboration-user-joined', event);
    });

    collaborationService.on('user-left', (event) => {
      this.io.to(`record:${event.recordId}`).emit('collaboration-user-left', event);
    });

    collaborationService.on('operation-applied', (event) => {
      this.io.to(`record:${event.recordId}`).emit('collaboration-operation', event);
    });

    collaborationService.on('cursor-updated', (event) => {
      this.io.to(`record:${event.recordId}`).emit('collaboration-cursor', event);
    });

    collaborationService.on('selection-updated', (event) => {
      this.io.to(`record:${event.recordId}`).emit('collaboration-selection', event);
    });

    collaborationService.on('conflicts-resolved', (event) => {
      this.io.to(`record:${event.recordId}`).emit('collaboration-conflicts-resolved', event);
    });
  }

  // Apply operation to actual content
  private async applyOperationToContent(recordId: string, operation: IEditorOperation): Promise<void> {
    try {
      switch (operation.type) {
        case 'insert':
          if (operation.content && operation.blockId) {
            await richEditorService.insertText(
              recordId,
              operation.blockId,
              operation.position,
              operation.content,
              operation.formatting,
              operation.userId
            );
          }
          break;

        case 'delete':
          if (operation.blockId && operation.length) {
            await richEditorService.deleteText(
              recordId,
              operation.blockId,
              operation.position,
              operation.position + operation.length,
              operation.userId
            );
          }
          break;

        case 'format':
          if (operation.blockId && operation.length && operation.formatting) {
            await richEditorService.applyFormatting(
              recordId,
              operation.blockId,
              operation.position,
              operation.position + operation.length,
              operation.formatting,
              operation.userId
            );
          }
          break;
      }
    } catch (error) {
      console.error('Failed to apply operation to content:', error);
    }
  }

  // Broadcast message to all users in a record session
  broadcastToRecord(recordId: string, event: string, data: any): void {
    this.io.to(`record:${recordId}`).emit(event, data);
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: any): void {
    const user = Array.from(this.connectedUsers.values()).find(u => u.userId === userId);
    if (user) {
      this.io.to(user.socketId).emit(event, data);
    }
  }

  // Get connected users for a record
  getRecordParticipants(recordId: string): ISocketUser[] {
    const socketIds = this.recordSessions.get(recordId) || new Set();
    return Array.from(socketIds)
      .map(socketId => this.connectedUsers.get(socketId))
      .filter(user => user !== undefined) as ISocketUser[];
  }

  // Get total connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get active record sessions count
  getActiveSessionsCount(): number {
    return this.recordSessions.size;
  }

  // Force disconnect user
  disconnectUser(userId: string, reason?: string): void {
    const user = Array.from(this.connectedUsers.values()).find(u => u.userId === userId);
    if (user) {
      const socket = this.io.sockets.sockets.get(user.socketId);
      if (socket) {
        socket.emit('force-disconnect', { reason: reason || 'Disconnected by server' });
        socket.disconnect(true);
      }
    }
  }

  // Cleanup inactive sessions
  cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [recordId, socketIds] of this.recordSessions.entries()) {
      const activeSocketIds = Array.from(socketIds).filter(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        return socket && (now - socket.handshake.issued) < inactiveThreshold;
      });

      if (activeSocketIds.length === 0) {
        this.recordSessions.delete(recordId);
      } else {
        this.recordSessions.set(recordId, new Set(activeSocketIds));
      }
    }
  }
}

export let webSocketService: WebSocketService;

export const initializeWebSocketService = (server: HttpServer): WebSocketService => {
  webSocketService = new WebSocketService(server);
  
  // Cleanup inactive sessions every 5 minutes
  setInterval(() => {
    webSocketService.cleanupInactiveSessions();
  }, 5 * 60 * 1000);
  
  return webSocketService;
};
