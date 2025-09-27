import { Schema, model, Document, Model } from 'mongoose';
import { ICalendarConnection, ECalendarProvider } from '../types/calendar.types';

// CalendarTypes Connection Document Interface with instance methods
export interface ICalendarConnectionDocument extends Document {
  // Connection properties (from ICalendarConnection but without id conflict)
  userId: string;
  provider: ECalendarProvider;

  // Connection details
  accountEmail: string;
  accountName?: string;

  // OAuth tokens
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;

  // Connection settings
  isActive: boolean;
  syncEnabled: boolean;
  syncFrequency: number; // Minutes
  lastSyncAt?: Date;

  // Sync settings
  syncSettings: {
    importEvents: boolean;
    exportEvents: boolean;
    bidirectionalSync: boolean;
    syncPastDays: number;
    syncFutureDays: number;
    conflictResolution: 'local' | 'remote' | 'manual';
  };

  // Error tracking
  lastError?: string;
  errorCount: number;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps (from IBaseEntity)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Document _id override
  _id: string;

  // Virtual properties
  readonly id: string;
  readonly syncStatus: 'inactive' | 'disabled' | 'error' | 'expired' | 'active';
  readonly nextSyncAt: Date | null;

  // Instance methods
  updateTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<this>;
  recordSyncSuccess(syncToken?: string): Promise<this>;
  recordSyncError(error: string): Promise<this>;
  resetErrors(): Promise<this>;
  disconnect(): Promise<this>;
  isTokenExpired(): boolean;
  shouldSync(): boolean;
}

// Static methods interface
export interface ICalendarConnectionModel extends Model<ICalendarConnectionDocument> {
  findByUser(userId: string, activeOnly?: boolean): Promise<ICalendarConnectionDocument[]>;
  findByProvider(provider: ECalendarProvider, activeOnly?: boolean): Promise<ICalendarConnectionDocument[]>;
  findDueForSync(): Promise<ICalendarConnectionDocument[]>;
  findExpiredTokens(): Promise<ICalendarConnectionDocument[]>;
  findByUserAndProvider(userId: string, provider: ECalendarProvider): Promise<ICalendarConnectionDocument | null>;
}

// CalendarTypes sync log static methods interface
export interface ICalendarSyncLogModel extends Model<ICalendarSyncLog> {
  findByConnection(connectionId: string, limit?: number): Promise<ICalendarSyncLog[]>;
  findRecentErrors(hours?: number): Promise<ICalendarSyncLog[]>;
}

// CalendarTypes Connection Schema
const CalendarConnectionSchema = new Schema<ICalendarConnectionDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    enum: Object.values(ECalendarProvider),
    required: true
  },
  
  // Connection details
  accountEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  accountName: {
    type: String,
    trim: true
  },
  
  // OAuth tokens (encrypted in production)
  accessToken: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  refreshToken: {
    type: String,
    select: false
  },
  tokenExpiresAt: {
    type: Date
  },
  
  // Connection settings
  isActive: {
    type: Boolean,
    default: true
  },
  syncEnabled: {
    type: Boolean,
    default: true
  },
  syncFrequency: {
    type: Number,
    default: 15, // 15 minutes
    min: 5,      // minimum 5 minutes
    max: 1440    // maximum 24 hours
  },
  lastSyncAt: {
    type: Date
  },
  
  // Sync settings
  syncSettings: {
    importEvents: {
      type: Boolean,
      default: true
    },
    exportEvents: {
      type: Boolean,
      default: false
    },
    bidirectionalSync: {
      type: Boolean,
      default: false
    },
    syncPastDays: {
      type: Number,
      default: 30,
      min: 0,
      max: 365
    },
    syncFutureDays: {
      type: Number,
      default: 365,
      min: 1,
      max: 1095 // 3 years
    },
    conflictResolution: {
      type: String,
      enum: ['local', 'remote', 'manual'],
      default: 'remote'
    }
  },
  
  // Error tracking
  lastError: {
    type: String
  },
  errorCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'calendar_connections'
});

// Indexes
CalendarConnectionSchema.index({ userId: 1, provider: 1 });
CalendarConnectionSchema.index({ userId: 1, isActive: 1 });
CalendarConnectionSchema.index({ provider: 1, accountEmail: 1 });
CalendarConnectionSchema.index({ tokenExpiresAt: 1 }, { sparse: true });
CalendarConnectionSchema.index({ lastSyncAt: 1 });

// Unique constraint for user-provider-account combination
CalendarConnectionSchema.index(
  { userId: 1, provider: 1, accountEmail: 1 }, 
  { unique: true }
);

// Virtual for ID
CalendarConnectionSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Virtual for token expiry status
CalendarConnectionSchema.virtual('isTokenExpired').get(function() {
  if (!this.tokenExpiresAt) return false;
  return this.tokenExpiresAt < new Date();
});

// Virtual for sync status
CalendarConnectionSchema.virtual('syncStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.syncEnabled) return 'disabled';
  if (this.errorCount > 5) return 'error';
  if (this.isTokenExpired()) return 'expired';
  return 'active';
});

// Virtual for next sync time
CalendarConnectionSchema.virtual('nextSyncAt').get(function() {
  if (!this.lastSyncAt || !this.syncEnabled) return null;
  return new Date(this.lastSyncAt.getTime() + this.syncFrequency * 60 * 1000);
});

// Transform output
CalendarConnectionSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    const result = { ...ret };
    if ('_id' in result) {
      delete (result as Record<string, unknown>)._id;
    }
    if ('__v' in result) {
      delete (result as Record<string, unknown>).__v;
    }
    if ('accessToken' in result) {
      delete (result as Record<string, unknown>).accessToken;
    }
    if ('refreshToken' in result) {
      delete (result as Record<string, unknown>).refreshToken;
    }
    return result;
  }
});

// Pre-save middleware
CalendarConnectionSchema.pre('save', function(next) {
  // Reset error count if connection is being reactivated
  if (this.isModified('isActive') && this.isActive) {
    this.errorCount = 0;
    this.lastError = undefined;
  }
  
  next();
});

// Static methods
CalendarConnectionSchema.statics.findByUser = function(userId: string, activeOnly = true) {
  const query: any = { userId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ provider: 1, accountEmail: 1 });
};

CalendarConnectionSchema.statics.findByProvider = function(provider: ECalendarProvider, activeOnly = true) {
  const query: any = { provider };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query);
};

CalendarConnectionSchema.statics.findDueForSync = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    syncEnabled: true,
    errorCount: { $lt: 10 }, // Stop syncing after 10 consecutive errors
    $or: [
      { lastSyncAt: { $exists: false } },
      { 
        lastSyncAt: { 
          $lt: new Date(now.getTime() - 15 * 60 * 1000) // Default 15 minutes
        } 
      }
    ]
  }).select('+accessToken +refreshToken');
};

CalendarConnectionSchema.statics.findExpiredTokens = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    tokenExpiresAt: { $lt: now }
  }).select('+accessToken +refreshToken');
};

CalendarConnectionSchema.statics.findByUserAndProvider = function(userId: string, provider: ECalendarProvider) {
  return this.findOne({ userId, provider, isActive: true });
};

// Instance methods
CalendarConnectionSchema.methods.updateTokens = function(accessToken: string, refreshToken?: string, expiresIn?: number) {
  this.accessToken = accessToken;
  if (refreshToken) {
    this.refreshToken = refreshToken;
  }
  if (expiresIn) {
    this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
  }
  this.errorCount = 0;
  this.lastError = undefined;
  return this.save();
};

CalendarConnectionSchema.methods.recordSyncSuccess = function(syncToken?: string) {
  this.lastSyncAt = new Date();
  this.errorCount = 0;
  this.lastError = undefined;
  
  if (syncToken) {
    this.metadata = { ...this.metadata, syncToken };
  }
  
  return this.save();
};

CalendarConnectionSchema.methods.recordSyncError = function(error: string) {
  this.errorCount += 1;
  this.lastError = error;
  this.lastSyncAt = new Date();
  
  // Disable sync after too many errors
  if (this.errorCount >= 10) {
    this.syncEnabled = false;
  }
  
  return this.save();
};

CalendarConnectionSchema.methods.resetErrors = function() {
  this.errorCount = 0;
  this.lastError = undefined;
  this.syncEnabled = true;
  return this.save();
};

CalendarConnectionSchema.methods.disconnect = function() {
  this.isActive = false;
  this.syncEnabled = false;
  this.accessToken = '';
  this.refreshToken = '';
  this.tokenExpiresAt = undefined;
  return this.save();
};

CalendarConnectionSchema.methods.updateSyncSettings = function(settings: Partial<ICalendarConnection['syncSettings']>) {
  this.syncSettings = { ...this.syncSettings, ...settings };
  return this.save();
};

CalendarConnectionSchema.methods.shouldSync = function() {
  if (!this.isActive || !this.syncEnabled) return false;
  if (this.errorCount >= 10) return false;
  if (this.isTokenExpired) return false;
  
  if (!this.lastSyncAt) return true;
  
  const nextSync = new Date(this.lastSyncAt.getTime() + this.syncFrequency * 60 * 1000);
  return new Date() >= nextSync;
};

export const CalendarConnectionModel = model<ICalendarConnectionDocument, ICalendarConnectionModel>('CalendarConnection', CalendarConnectionSchema);

// CalendarTypes sync log schema for tracking sync history
export interface ICalendarSyncLog extends Document {
  connectionId: string;
  syncType: 'full' | 'incremental' | 'manual';
  status: 'success' | 'error' | 'partial';
  startedAt: Date;
  completedAt?: Date;
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  error?: string;
  metadata: Record<string, unknown>;
  _id: string;

  // Instance methods
  complete(stats: {
    eventsProcessed?: number;
    eventsCreated?: number;
    eventsUpdated?: number;
    eventsDeleted?: number;
    error?: string;
  }): Promise<this>;
}

const CalendarSyncLogSchema = new Schema<ICalendarSyncLog>({
  connectionId: {
    type: String,
    required: true,
    ref: 'CalendarConnection',
    index: true
  },
  syncType: {
    type: String,
    enum: ['full', 'incremental', 'manual'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'error', 'partial'],
    required: true
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  eventsProcessed: {
    type: Number,
    default: 0,
    min: 0
  },
  eventsCreated: {
    type: Number,
    default: 0,
    min: 0
  },
  eventsUpdated: {
    type: Number,
    default: 0,
    min: 0
  },
  eventsDeleted: {
    type: Number,
    default: 0,
    min: 0
  },
  error: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false,
  collection: 'calendar_sync_logs'
});

// Indexes
CalendarSyncLogSchema.index({ connectionId: 1, startedAt: -1 });
CalendarSyncLogSchema.index({ status: 1, startedAt: -1 });

// TTL index to automatically delete old logs after 30 days
CalendarSyncLogSchema.index({ startedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual for ID
CalendarSyncLogSchema.virtual('id').get(function() {
  return this._id.toString();
});

// Virtual for duration
CalendarSyncLogSchema.virtual('duration').get(function() {
  if (!this.completedAt) return null;
  return this.completedAt.getTime() - this.startedAt.getTime();
});

// Transform output
CalendarSyncLogSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    const result = { ...ret };
    if ('_id' in result) {
      delete (result as Record<string, unknown>)._id;
    }
    if ('__v' in result) {
      delete (result as Record<string, unknown>).__v;
    }
    return result;
  }
});

// Static methods
CalendarSyncLogSchema.statics.findByConnection = function(connectionId: string, limit = 50) {
  return this.find({ connectionId })
    .sort({ startedAt: -1 })
    .limit(limit);
};

CalendarSyncLogSchema.statics.findRecentErrors = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    status: 'error',
    startedAt: { $gte: since }
  }).sort({ startedAt: -1 });
};

// Instance methods
CalendarSyncLogSchema.methods.complete = function(stats: {
  eventsProcessed?: number;
  eventsCreated?: number;
  eventsUpdated?: number;
  eventsDeleted?: number;
  error?: string;
}) {
  this.completedAt = new Date();
  this.eventsProcessed = stats.eventsProcessed || 0;
  this.eventsCreated = stats.eventsCreated || 0;
  this.eventsUpdated = stats.eventsUpdated || 0;
  this.eventsDeleted = stats.eventsDeleted || 0;
  
  if (stats.error) {
    this.status = 'error';
    this.error = stats.error;
  } else {
    this.status = 'success';
  }
  
  return this.save();
};

export const CalendarSyncLogModel = model<ICalendarSyncLog, ICalendarSyncLogModel>('CalendarSyncLog', CalendarSyncLogSchema);
