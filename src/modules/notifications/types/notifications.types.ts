export interface INotificationCreateRequest {
  userId: string;
  type: 'database_shared' | 'record_created' | 'workspace_invite' | 'system_update' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface INotificationsResult {
  notifications: NotificationResponse[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface INotificationQuery {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface INotificationUpdateRequest {
  title?: string;
  message?: string;
  isRead?: boolean;
  data?: Record<string, any>;
}

export interface IBulkNotificationUpdateRequest {
  notificationIds: string[];
  data: INotificationUpdateRequest;
}

export interface INotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  notificationsByType: Record<string, number>;
  recentNotifications: NotificationResponse[];
}

// Response interface for API
export interface NotificationResponse {
  _id: string;
  id?: string; // For compatibility with frontend
  userId: string;
  type: 'database_shared' | 'record_created' | 'workspace_invite' | 'system_update' | 'reminder' | 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export from model for convenience
export type { INotification, INotificationDocument } from '../models/notification.model';
