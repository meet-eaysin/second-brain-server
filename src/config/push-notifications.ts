import webpush from 'web-push';
import admin from 'firebase-admin';
import { createAppError } from '@/utils/error.utils';

// Web Push Configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@secondbrain.com';

// Firebase Configuration
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';

// Initialize Web Push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;

if (FIREBASE_PROJECT_ID && FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY,
        clientEmail: FIREBASE_CLIENT_EMAIL,
      }),
    }, 'push-notifications');
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
  }
}

// Push Notification Interfaces
export interface IWebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IPushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  timestamp?: number;
  vibrate?: number[];
  url?: string;
}

export interface IFCMPayload {
  token: string;
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  android?: {
    priority: 'normal' | 'high';
    notification: {
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      clickAction?: string;
      bodyLocKey?: string;
      bodyLocArgs?: string[];
      titleLocKey?: string;
      titleLocArgs?: string[];
    };
  };
  apns?: {
    payload: {
      aps: {
        alert?: {
          title?: string;
          body?: string;
          titleLocKey?: string;
          titleLocArgs?: string[];
          actionLocKey?: string;
          locKey?: string;
          locArgs?: string[];
          launchImage?: string;
        };
        badge?: number;
        sound?: string;
        contentAvailable?: boolean;
        mutableContent?: boolean;
        category?: string;
        threadId?: string;
      };
    };
    headers?: Record<string, string>;
  };
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: Record<string, string>;
  };
}

/**
 * Send Web Push notification
 */
export const sendWebPushNotification = async (
  subscription: IWebPushSubscription,
  payload: IPushNotificationPayload
): Promise<void> => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw createAppError('Web Push not configured', 500);
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/notification-icon.png',
      badge: payload.badge || '/icons/badge-icon.png',
      image: payload.image,
      data: {
        ...payload.data,
        url: payload.url || '/',
        timestamp: payload.timestamp || Date.now(),
      },
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      tag: payload.tag,
      vibrate: payload.vibrate || [200, 100, 200],
    });

    const options = {
      TTL: 24 * 60 * 60, // 24 hours
      urgency: 'normal' as const,
      headers: {
        'Content-Encoding': 'gzip',
      },
    };

    await webpush.sendNotification(subscription, notificationPayload, options);
  } catch (error) {
    console.error('Web Push notification failed:', error);
    throw createAppError('Failed to send web push notification', 500);
  }
};

/**
 * Send FCM notification
 */
export const sendFCMNotification = async (payload: IFCMPayload): Promise<void> => {
  try {
    if (!firebaseApp) {
      throw createAppError('Firebase not configured', 500);
    }

    const messaging = admin.messaging(firebaseApp);
    
    const message: admin.messaging.Message = {
      token: payload.token,
      notification: payload.notification,
      data: payload.data,
      android: payload.android,
      apns: payload.apns,
      webpush: payload.webpush,
    };

    await messaging.send(message);
  } catch (error) {
    console.error('FCM notification failed:', error);
    throw createAppError('Failed to send FCM notification', 500);
  }
};

/**
 * Send FCM notification to multiple tokens
 */
export const sendFCMMulticast = async (
  tokens: string[],
  payload: Omit<IFCMPayload, 'token'>
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> => {
  try {
    if (!firebaseApp) {
      throw createAppError('Firebase not configured', 500);
    }

    const messaging = admin.messaging(firebaseApp);
    
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: payload.notification,
      data: payload.data,
      android: payload.android,
      apns: payload.apns,
      webpush: payload.webpush,
    };

    const response = await messaging.sendEachForMulticast(message);
    
    const failedTokens: string[] = [];
    response.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    console.error('FCM multicast failed:', error);
    throw createAppError('Failed to send FCM multicast notification', 500);
  }
};

/**
 * Validate FCM token
 */
export const validateFCMToken = async (token: string): Promise<boolean> => {
  try {
    if (!firebaseApp) {
      return false;
    }

    const messaging = admin.messaging(firebaseApp);
    
    // Try to send a dry-run message
    await messaging.send({
      token,
      data: { test: 'true' },
    }, true); // dry-run = true

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Generate VAPID keys (for setup)
 */
export const generateVAPIDKeys = (): { publicKey: string; privateKey: string } => {
  return webpush.generateVAPIDKeys();
};

/**
 * Get VAPID public key
 */
export const getVAPIDPublicKey = (): string => {
  return VAPID_PUBLIC_KEY;
};

/**
 * Subscribe to topic (FCM)
 */
export const subscribeToTopic = async (
  tokens: string[],
  topic: string
): Promise<void> => {
  try {
    if (!firebaseApp) {
      throw createAppError('Firebase not configured', 500);
    }

    const messaging = admin.messaging(firebaseApp);
    await messaging.subscribeToTopic(tokens, topic);
  } catch (error) {
    console.error('Topic subscription failed:', error);
    throw createAppError('Failed to subscribe to topic', 500);
  }
};

/**
 * Unsubscribe from topic (FCM)
 */
export const unsubscribeFromTopic = async (
  tokens: string[],
  topic: string
): Promise<void> => {
  try {
    if (!firebaseApp) {
      throw createAppError('Firebase not configured', 500);
    }

    const messaging = admin.messaging(firebaseApp);
    await messaging.unsubscribeFromTopic(tokens, topic);
  } catch (error) {
    console.error('Topic unsubscription failed:', error);
    throw createAppError('Failed to unsubscribe from topic', 500);
  }
};

export { webpush, admin };
