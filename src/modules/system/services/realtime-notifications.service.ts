import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { INotificationResponse, ENotificationType } from '../types/notifications.types';
import { TJwtPayload } from '@/users/types/user.types';

// Connected users map
const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketUsers = new Map<string, string>(); // socketId -> userId

// Notification rooms for different scopes
const NOTIFICATION_ROOMS = {
  USER: (userId: string) => `user:${userId}`,
  WORKSPACE: (workspaceId: string) => `workspace:${workspaceId}`,
  GLOBAL: 'global'
};

let io: SocketIOServer | null = null;

/**
 * Initialize real-time notification system
 */
export const initializeRealtimeNotifications = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as TJwtPayload & { workspaceId?: string };
      socket.userId = decoded.userId;
      socket.workspaceId = decoded.workspaceId || 'default';

      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handling
  io.on('connection', (socket: Socket) => {
    handleConnection(socket);
  });

  console.log('🔄 Real-time notification system initialized');
  return io;
};

/**
 * Handle new socket connection
 */
const handleConnection = (socket: Socket): void => {
  const userId = socket.userId;
  const workspaceId = socket.workspaceId;

  console.log(`🔗 User ${userId} connected via socket ${socket.id}`);

  // Track connected user
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId)!.add(socket.id);
  socketUsers.set(socket.id, userId);

  // Join user-specific room
  socket.join(NOTIFICATION_ROOMS.USER(userId));

  // Join workspace room if available
  if (workspaceId) {
    socket.join(NOTIFICATION_ROOMS.WORKSPACE(workspaceId));
  }

  // Send connection confirmation
  socket.emit('notification:connected', {
    message: 'Real-time notifications connected',
    userId,
    timestamp: new Date().toISOString()
  });

  // Handle notification acknowledgment
  socket.on('notification:ack', (data: { notificationId: string }) => {
    handleNotificationAck(socket, data.notificationId);
  });

  // Handle notification read
  socket.on('notification:read', (data: { notificationId: string }) => {
    handleNotificationRead(socket, data.notificationId);
  });

  // Handle bulk notification read
  socket.on('notification:read-all', () => {
    handleBulkNotificationRead(socket);
  });

  // Handle notification preferences update
  socket.on('notification:preferences', (data: any) => {
    handlePreferencesUpdate(socket, data);
  });

  // Handle typing indicators for comments
  socket.on('typing:start', (data: { entityId: string; entityType: string }) => {
    handleTypingStart(socket, data);
  });

  socket.on('typing:stop', (data: { entityId: string; entityType: string }) => {
    handleTypingStop(socket, data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    handleDisconnection(socket);
  });

  // Handle errors
  socket.on('error', error => {
    console.error(`Socket error for user ${userId}:`, error);
  });
};

/**
 * Handle socket disconnection
 */
const handleDisconnection = (socket: Socket): void => {
  const userId = socket.userId;

  console.log(`🔌 User ${userId} disconnected from socket ${socket.id}`);

  // Remove from tracking
  if (connectedUsers.has(userId)) {
    connectedUsers.get(userId)!.delete(socket.id);
    if (connectedUsers.get(userId)!.size === 0) {
      connectedUsers.delete(userId);
    }
  }
  socketUsers.delete(socket.id);
};

/**
 * Send real-time notification to user
 */
export const sendRealtimeNotification = async (
  notification: INotificationResponse
): Promise<void> => {
  if (!io) {
    console.warn('Real-time notification system not initialized');
    return;
  }

  try {
    const room = NOTIFICATION_ROOMS.USER(notification.id);

    // Send to user's room
    io.to(room).emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString(),
      realtime: true
    });

    // Also send to workspace room for collaborative notifications
    if (notification.metadata?.workspaceId) {
      const workspaceRoom = NOTIFICATION_ROOMS.WORKSPACE(
        notification.metadata.workspaceId as string
      );
      io.to(workspaceRoom).emit('notification:workspace', {
        ...notification,
        timestamp: new Date().toISOString(),
        scope: 'workspace'
      });
    }

    console.log(`📡 Sent real-time notification to user ${notification.id}: ${notification.title}`);
  } catch (error) {
    console.error('Error sending real-time notification:', error);
  }
};

/**
 * Send notification to multiple users
 */
export const sendRealtimeNotificationToUsers = async (
  userIds: string[],
  notification: Omit<INotificationResponse, 'id'>
): Promise<void> => {
  if (!io) {
    console.warn('Real-time notification system not initialized');
    return;
  }

  try {
    for (const userId of userIds) {
      const room = NOTIFICATION_ROOMS.USER(userId);
      io.to(room).emit('notification:new', {
        ...notification,
        id: `${userId}-${Date.now()}`, // Temporary ID for real-time
        timestamp: new Date().toISOString(),
        realtime: true
      });
    }

    console.log(`📡 Sent real-time notification to ${userIds.length} users: ${notification.title}`);
  } catch (error) {
    console.error('Error sending real-time notification to users:', error);
  }
};

/**
 * Broadcast system-wide notification
 */
export const broadcastSystemNotification = async (notification: {
  type: ENotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> => {
  if (!io) {
    console.warn('Real-time notification system not initialized');
    return;
  }

  try {
    io.emit('notification:system', {
      ...notification,
      timestamp: new Date().toISOString(),
      scope: 'system'
    });

    console.log(`📢 Broadcasted system notification: ${notification.title}`);
  } catch (error) {
    console.error('Error broadcasting system notification:', error);
  }
};

/**
 * Handle notification acknowledgment
 */
const handleNotificationAck = async (socket: Socket, notificationId: string): Promise<void> => {
  try {
    // Update notification status to delivered
    // In a real implementation, this would update the database
    console.log(`✅ Notification ${notificationId} acknowledged by user ${socket.userId}`);

    socket.emit('notification:ack-confirmed', {
      notificationId,
      status: 'delivered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling notification ack:', error);
  }
};

/**
 * Handle notification read
 */
const handleNotificationRead = async (socket: Socket, notificationId: string): Promise<void> => {
  try {
    // Update notification status to read
    // In a real implementation, this would call the notification service
    console.log(`👁️ Notification ${notificationId} read by user ${socket.userId}`);

    socket.emit('notification:read-confirmed', {
      notificationId,
      status: 'read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling notification read:', error);
  }
};

/**
 * Handle bulk notification read
 */
const handleBulkNotificationRead = async (socket: Socket): Promise<void> => {
  try {
    // Mark all notifications as read for user
    // In a real implementation, this would call the notification service
    console.log(`📖 All notifications marked as read by user ${socket.userId}`);

    socket.emit('notification:read-all-confirmed', {
      status: 'all-read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling bulk notification read:', error);
  }
};

/**
 * Handle preferences update
 */
const handlePreferencesUpdate = async (socket: Socket, preferences: any): Promise<void> => {
  try {
    // Update user notification preferences
    // In a real implementation, this would call the preferences service
    console.log(`⚙️ Notification preferences updated for user ${socket.userId}`);

    socket.emit('notification:preferences-updated', {
      preferences,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling preferences update:', error);
  }
};

/**
 * Handle typing start
 */
const handleTypingStart = (
  socket: Socket,
  data: { entityId: string; entityType: string }
): void => {
  const room = `${data.entityType}:${data.entityId}`;
  socket.to(room).emit('typing:start', {
    userId: socket.userId,
    entityId: data.entityId,
    entityType: data.entityType,
    timestamp: new Date().toISOString()
  });
};

/**
 * Handle typing stop
 */
const handleTypingStop = (socket: Socket, data: { entityId: string; entityType: string }): void => {
  const room = `${data.entityType}:${data.entityId}`;
  socket.to(room).emit('typing:stop', {
    userId: socket.userId,
    entityId: data.entityId,
    entityType: data.entityType,
    timestamp: new Date().toISOString()
  });
};

/**
 * Get connected users count
 */
export const getConnectedUsersCount = (): number => {
  return connectedUsers.size;
};

/**
 * Get connected users
 */
export const getConnectedUsers = (): string[] => {
  return Array.from(connectedUsers.keys());
};

/**
 * Check if user is connected
 */
export const isUserConnected = (userId: string): boolean => {
  return connectedUsers.has(userId);
};

/**
 * Send notification to specific socket
 */
export const sendToSocket = (
  socketId: string,
  event: string,
  data: Record<string, unknown>
): void => {
  if (io) {
    io.to(socketId).emit(event, data);
  }
};

/**
 * Join user to a room
 */
export const joinUserToRoom = (userId: string, room: string): void => {
  if (!io) return;

  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    for (const socketId of userSockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(room);
      }
    }
  }
};

/**
 * Remove user from room
 */
export const removeUserFromRoom = (userId: string, room: string): void => {
  if (!io) return;

  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    for (const socketId of userSockets) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(room);
      }
    }
  }
};

export { io };
