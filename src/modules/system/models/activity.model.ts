import mongoose, { Schema } from 'mongoose';
import { createBaseSchema } from '@/modules/core/models/base.model';
import { EActivityType, EActivityContext } from '../types/activity.types';

const ActivitySchema = createBaseSchema({
  type: {
    type: String,
    enum: Object.values(EActivityType),
    required: true,
    index: true
  },
  context: {
    type: String,
    enum: Object.values(EActivityContext),
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 500
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    index: true
  },
  entityType: {
    type: String,
    index: true
  },
  entityName: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  changes: [
    {
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
      changeType: {
        type: String,
        enum: ['created', 'updated', 'deleted']
      }
    }
  ],
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for efficient queries
ActivitySchema.index({ workspaceId: 1, timestamp: -1 });
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ entityId: 1, entityType: 1, timestamp: -1 });
ActivitySchema.index({ type: 1, timestamp: -1 });
ActivitySchema.index({ context: 1, timestamp: -1 });

// Index for page visit queries
ActivitySchema.index({ 'metadata.page': 1, workspaceId: 1, timestamp: -1 });

export const ActivityModel = mongoose.model('Activity', ActivitySchema);
