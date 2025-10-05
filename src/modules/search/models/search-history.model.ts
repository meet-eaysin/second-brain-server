import mongoose, { Model } from 'mongoose';
import { createBaseSchema, IBaseDocument, QueryHelpers } from '@/modules/core/models/base.model';
import { IRecentSearch, ESearchScope } from '../types/search.types';

export interface ISearchHistoryDocument extends IRecentSearch, IBaseDocument {
  // Instance methods
  updateResultCount(count: number): Promise<this>;
}

export type TSearchHistoryDocument = ISearchHistoryDocument;

export type TSearchHistoryModel = Model<TSearchHistoryDocument, QueryHelpers> & {
  findByUser(userId: string, limit?: number): Promise<TSearchHistoryDocument[]>;
  findPopularQueries(limit?: number): Promise<Array<{ query: string; count: number }>>;
  findByScope(scope: ESearchScope, limit?: number): Promise<TSearchHistoryDocument[]>;
  cleanupOldSearches(olderThanDays: number): Promise<number>;
};

const SearchHistorySchema = createBaseSchema(
  {
    userId: {
      type: String,
      required: true
    },
    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    scope: {
      type: String,
      enum: Object.values(ESearchScope),
      required: true
    },
    filters: {
      workspaceId: String,
      databaseTypes: [String],
      databaseIds: [String],
      createdBy: String,
      dateRange: {
        start: Date,
        end: Date
      },
      tags: [String],
      isPublic: Boolean,
      isArchived: Boolean,
      isTemplate: Boolean
    },
    resultCount: {
      type: Number,
      required: true,
      min: 0
    },
    searchedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    statics: {
      findByUser(userId: string, limit: number = 10): Promise<TSearchHistoryDocument[]> {
        return this.find({ userId }).sort({ searchedAt: -1 }).limit(limit).exec();
      },

      findPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
        return this.aggregate([
          {
            $group: {
              _id: '$query',
              count: { $sum: 1 },
              lastSearched: { $max: '$searchedAt' }
            }
          },
          {
            $sort: { count: -1, lastSearched: -1 }
          },
          {
            $limit: limit
          },
          {
            $project: {
              query: '$_id',
              count: 1,
              _id: 0
            }
          }
        ]);
      },

      findByScope(scope: ESearchScope, limit: number = 10): Promise<TSearchHistoryDocument[]> {
        return this.find({ scope }).sort({ searchedAt: -1 }).limit(limit).exec();
      },

      async cleanupOldSearches(olderThanDays: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.deleteMany({
          searchedAt: { $lt: cutoffDate }
        });
        return result.deletedCount || 0;
      }
    }
  }
);

// Indexes for performance
SearchHistorySchema.index({ userId: 1, searchedAt: -1 });
SearchHistorySchema.index({ query: 1, userId: 1 });
SearchHistorySchema.index({ scope: 1, searchedAt: -1 });
SearchHistorySchema.index({ searchedAt: -1 }); // For cleanup

// Instance methods
SearchHistorySchema.methods.updateResultCount = function (count: number) {
  this.resultCount = count;
  return this.save();
};

// TTL index to automatically delete old searches after 90 days
SearchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const SearchHistoryModel = mongoose.model<TSearchHistoryDocument, TSearchHistoryModel>(
  'SearchHistory',
  SearchHistorySchema
);

export default SearchHistoryModel;
