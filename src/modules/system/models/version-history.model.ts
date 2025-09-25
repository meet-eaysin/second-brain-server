import mongoose, { Schema } from 'mongoose';
import { createBaseSchema } from '@/modules/core/models/base.model';

const VersionHistorySchema = createBaseSchema({
  entityId: {
    type: String,
    required: true,
    index: true
  },
  entityType: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: Number,
    required: true,
    index: true
  },
  changes: [
    {
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
      fieldType: String
    }
  ],
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  snapshot: {
    type: Schema.Types.Mixed
  },
  comment: {
    type: String
  }
});

// Compound indexes for efficient queries
VersionHistorySchema.index({ entityId: 1, entityType: 1, version: 1 });
VersionHistorySchema.index({ entityId: 1, entityType: 1, timestamp: -1 });

export const VersionHistoryModel = mongoose.model('VersionHistory', VersionHistorySchema);