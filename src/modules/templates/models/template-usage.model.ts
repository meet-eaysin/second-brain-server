import mongoose, { Schema, Model } from 'mongoose';
import { ITemplateUsage } from '../types/template.types';
import { createBaseSchema, IBaseDocument } from '@/modules/core/models/base.model';

export type TTemplateUsageDocument = ITemplateUsage & IBaseDocument;

export type TTemplateUsageModel = Model<TTemplateUsageDocument> & {
  findByTemplate(templateId: string): Promise<TTemplateUsageDocument[]>;
  findByUser(userId: string): Promise<TTemplateUsageDocument[]>;
  findByWorkspace(workspaceId: string): Promise<TTemplateUsageDocument[]>;
  getUsageStats(templateId: string): Promise<any>;
  getPopularTemplates(limit?: number): Promise<any[]>;
  getUserTemplateHistory(userId: string, limit?: number): Promise<TTemplateUsageDocument[]>;
};

const TemplateUsageSchema = createBaseSchema({
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  usedAt: {
    type: Date,
    default: Date.now
  },
  context: {
    type: String,
    enum: ['manual', 'suggestion', 'onboarding'],
    required: true,
    default: 'manual'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

// Compound indexes for better performance
TemplateUsageSchema.index({ templateId: 1, usedAt: -1 });
TemplateUsageSchema.index({ userId: 1, usedAt: -1 });
TemplateUsageSchema.index({ workspaceId: 1, usedAt: -1 });
TemplateUsageSchema.index({ usedAt: -1, context: 1 });

// Static methods
TemplateUsageSchema.statics.findByTemplate = function (
  templateId: string
): Promise<TTemplateUsageDocument[]> {
  return (this as TTemplateUsageModel).find({ templateId, isDeleted: { $ne: true } })
    .sort({ usedAt: -1 })
    .populate('userId', 'name email')
    .populate('workspaceId', 'name')
    .exec();
};

TemplateUsageSchema.statics.findByUser = function (
  userId: string
): Promise<TTemplateUsageDocument[]> {
  return (this as TTemplateUsageModel).find({ userId, isDeleted: { $ne: true } })
    .sort({ usedAt: -1 })
    .populate('templateId', 'name type category')
    .populate('workspaceId', 'name')
    .exec();
};

TemplateUsageSchema.statics.findByWorkspace = function (
  workspaceId: string
): Promise<TTemplateUsageDocument[]> {
  return (this as TTemplateUsageModel).find({ workspaceId, isDeleted: { $ne: true } })
    .sort({ usedAt: -1 })
    .populate('templateId', 'name type category')
    .populate('userId', 'name email')
    .exec();
};

TemplateUsageSchema.statics.getUsageStats = async function (
  templateId: string
): Promise<any> {
  const pipeline: any[] = [
    { $match: { templateId: new mongoose.Types.ObjectId(templateId), isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalUsage: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        firstUsed: { $min: '$usedAt' },
        lastUsed: { $max: '$usedAt' },
        contextBreakdown: {
          $push: '$context'
        }
      }
    },
    {
      $project: {
        totalUsage: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        firstUsed: 1,
        lastUsed: 1,
        contextBreakdown: {
          $reduce: {
            input: '$contextBreakdown',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $cond: [
                    { $eq: ['$$this', 'manual'] },
                    { manual: { $add: [{ $ifNull: ['$$value.manual', 0] }, 1] } },
                    {
                      $cond: [
                        { $eq: ['$$this', 'suggestion'] },
                        { suggestion: { $add: [{ $ifNull: ['$$value.suggestion', 0] }, 1] } },
                        { onboarding: { $add: [{ $ifNull: ['$$value.onboarding', 0] }, 1] } }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ];

  const result = await (this as TTemplateUsageModel).aggregate(pipeline);
  return (
    result[0] || {
      totalUsage: 0,
      uniqueUsers: 0,
      firstUsed: null,
      lastUsed: null,
      contextBreakdown: {}
    }
  );
};

TemplateUsageSchema.statics.getPopularTemplates = async function (
  limit = 10
): Promise<any[]> {
  const pipeline: any[] = [
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$templateId',
        usageCount: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        lastUsed: { $max: '$usedAt' }
      }
    },
    {
      $project: {
        templateId: '$_id',
        usageCount: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        lastUsed: 1
      }
    },
    { $sort: { usageCount: -1, lastUsed: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'templates',
        localField: 'templateId',
        foreignField: '_id',
        as: 'template'
      }
    },
    { $unwind: '$template' },
    {
      $project: {
        templateId: 1,
        usageCount: 1,
        uniqueUsers: 1,
        lastUsed: 1,
        'template.name': 1,
        'template.type': 1,
        'template.category': 1,
        'template.rating': 1,
        'template.isOfficial': 1,
        'template.isFeatured': 1
      }
    }
  ];

  return (this as TTemplateUsageModel).aggregate(pipeline);
};

TemplateUsageSchema.statics.getUserTemplateHistory = function (
  userId: string,
  limit = 20
): Promise<TTemplateUsageDocument[]> {
  return (this as TTemplateUsageModel).find({ userId, isDeleted: { $ne: true } })
    .sort({ usedAt: -1 })
    .limit(limit)
    .populate('templateId', 'name type category icon color')
    .populate('workspaceId', 'name')
    .exec();
};

// Instance methods
TemplateUsageSchema.methods.getUsageContext = function () {
  return {
    template: this.templateId,
    user: this.userId,
    workspace: this.workspaceId,
    usedAt: this.usedAt,
    context: this.context,
    metadata: this.metadata
  };
};

export const TemplateUsageModel = mongoose.model<TTemplateUsageDocument, TTemplateUsageModel>(
  'TemplateUsage',
  TemplateUsageSchema
);
