import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  IFormulaPropertyConfig,
  IFormulaPropertyDocument,
  IFormulaCacheEntry,
  IFormulaPerformanceMetrics
} from '../types/formula.types';
import { createBaseSchema, IBaseDocument } from '@/modules/core/models/base.model';
import { EPropertyType } from '@/modules/core/types/property.types';

// Formula property document
export type TFormulaPropertyDocument = IFormulaPropertyDocument & IBaseDocument;

// Formula cache document
export type TFormulaCacheDocument = IFormulaCacheEntry & IBaseDocument;

// Formula performance document
export type TFormulaPerformanceDocument = IFormulaPerformanceMetrics & IBaseDocument;

// Formula property model interface
export type TFormulaPropertyModel = Model<TFormulaPropertyDocument> & {
  findByDatabase(databaseId: string): Promise<TFormulaPropertyDocument[]>;
  findByProperty(
    databaseId: string,
    propertyName: string
  ): Promise<TFormulaPropertyDocument | null>;
  findDependentFormulas(propertyName: string): Promise<TFormulaPropertyDocument[]>;
  updateDependencies(formulaId: string, dependencies: string[]): Promise<void>;
};

// Formula cache model interface
export type TFormulaCacheModel = Model<TFormulaCacheDocument> & {
  findByRecord(recordId: string): Promise<TFormulaCacheDocument[]>;
  findByProperty(recordId: string, propertyName: string): Promise<TFormulaCacheDocument | null>;
  invalidateByDependency(dependency: string): Promise<void>;
  cleanupExpired(): Promise<number>;
  getCacheStats(): Promise<{ totalEntries: number; hitRate: number; avgAge: number }>;
};

// Formula performance model interface
export type TFormulaPerformanceModel = Model<TFormulaPerformanceDocument> & {
  recordExecution(formulaId: string, executionTime: number, success: boolean): Promise<void>;
  getPerformanceStats(formulaId: string): Promise<TFormulaPerformanceDocument | null>;
  getSlowFormulas(limit?: number): Promise<TFormulaPerformanceDocument[]>;
  getErrorProneFormulas(limit?: number): Promise<TFormulaPerformanceDocument[]>;
};

// Formula property schema
const FormulaPropertySchema = createBaseSchema({
  databaseId: {
    type: Schema.Types.ObjectId,
    ref: 'Database',
    required: true,
    index: true
  },
  propertyName: {
    type: String,
    required: true,
    maxlength: 100,
    index: true
  },
  expression: {
    type: String,
    required: true,
    maxlength: 5000
  },
  returnType: {
    type: String,
    enum: Object.values(EPropertyType),
    required: true
  },
  dependencies: {
    type: [String],
    default: [],
    index: true
  },
  isAsync: {
    type: Boolean,
    default: false
  },
  cacheEnabled: {
    type: Boolean,
    default: true
  },
  cacheTTL: {
    type: Number,
    min: 0,
    max: 86400 // 24 hours max
  },
  recalculateOnDependencyChange: {
    type: Boolean,
    default: true
  },
  errorHandling: {
    type: String,
    enum: ['throw', 'return_null', 'return_default'],
    default: 'return_null'
  },
  defaultValue: {
    type: Schema.Types.Mixed
  },
  precision: {
    type: Number,
    min: 0,
    max: 10
  },
  format: {
    type: String,
    maxlength: 100
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastValidated: {
    type: Date
  },
  validationErrors: {
    type: [String],
    default: []
  },
  complexity: {
    type: Number,
    min: 0,
    default: 0
  }
});

// Compound indexes
FormulaPropertySchema.index({ databaseId: 1, propertyName: 1 }, { unique: true });
FormulaPropertySchema.index({ dependencies: 1, isActive: 1 });
FormulaPropertySchema.index({ complexity: -1, isActive: 1 });

// Static methods for formula properties
FormulaPropertySchema.statics.findByDatabase = function (
  databaseId: string
): Promise<TFormulaPropertyDocument[]> {
  return (this as TFormulaPropertyModel).find({
    databaseId,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

FormulaPropertySchema.statics.findByProperty = function (
  databaseId: string,
  propertyName: string
): Promise<TFormulaPropertyDocument | null> {
  return (this as TFormulaPropertyModel).findOne({
    databaseId,
    propertyName,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

FormulaPropertySchema.statics.findDependentFormulas = function (
  propertyName: string
): Promise<TFormulaPropertyDocument[]> {
  return (this as TFormulaPropertyModel).find({
    dependencies: propertyName,
    isActive: true,
    isDeleted: { $ne: true }
  });
};

FormulaPropertySchema.statics.updateDependencies = async function (
  formulaId: string,
  dependencies: string[]
): Promise<void> {
  await (this as TFormulaPropertyModel).findByIdAndUpdate(formulaId, {
    dependencies,
    lastValidated: new Date()
  });
};

// Formula cache schema
const FormulaCacheSchema = createBaseSchema({
  recordId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  propertyName: {
    type: String,
    required: true,
    maxlength: 100,
    index: true
  },
  expression: {
    type: String,
    required: true,
    maxlength: 5000
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['number', 'text', 'boolean', 'date', 'array', 'null', 'any'],
    required: true
  },
  dependencies: {
    type: [String],
    default: [],
    index: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  executionTime: {
    type: Number,
    min: 0
  },
  hitCount: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Compound indexes for cache
FormulaCacheSchema.index({ recordId: 1, propertyName: 1 }, { unique: true });
FormulaCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
FormulaCacheSchema.index({ dependencies: 1, calculatedAt: -1 });

// Static methods for formula cache
FormulaCacheSchema.statics.findByRecord = function (
  recordId: string
): Promise<TFormulaCacheDocument[]> {
  return (this as TFormulaCacheModel).find({ recordId, isDeleted: { $ne: true } });
};

FormulaCacheSchema.statics.findByProperty = function (
  recordId: string,
  propertyName: string
): Promise<TFormulaCacheDocument | null> {
  return (this as TFormulaCacheModel).findOne({ recordId, propertyName, isDeleted: { $ne: true } });
};

FormulaCacheSchema.statics.invalidateByDependency = async function (
  dependency: string
): Promise<void> {
  await (this as TFormulaCacheModel).deleteMany({ dependencies: dependency });
};

FormulaCacheSchema.statics.cleanupExpired = async function (): Promise<number> {
  const result = await (this as TFormulaCacheModel).deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount || 0;
};

FormulaCacheSchema.statics.getCacheStats = async function (): Promise<{
  totalEntries: number;
  hitRate: number;
  avgAge: number;
}> {
  const pipeline = [
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalHits: { $sum: '$hitCount' },
        avgAge: { $avg: { $subtract: [new Date(), '$calculatedAt'] } }
      }
    }
  ];

  const result = await (this as TFormulaCacheModel).aggregate(pipeline);
  const stats = result[0] || { totalEntries: 0, totalHits: 0, avgAge: 0 };

  return {
    totalEntries: stats.totalEntries,
    hitRate: stats.totalEntries > 0 ? stats.totalHits / stats.totalEntries : 0,
    avgAge: stats.avgAge / (1000 * 60 * 60) // Convert to hours
  };
};

// Formula performance schema
const FormulaPerformanceSchema = createBaseSchema({
  formulaId: {
    type: Schema.Types.ObjectId,
    ref: 'FormulaProperty',
    required: true,
    index: true
  },
  expression: {
    type: String,
    required: true,
    maxlength: 5000
  },
  totalExecutions: {
    type: Number,
    default: 0,
    min: 0
  },
  averageExecutionTime: {
    type: Number,
    default: 0,
    min: 0
  },
  maxExecutionTime: {
    type: Number,
    default: 0,
    min: 0
  },
  minExecutionTime: {
    type: Number,
    default: Number.MAX_SAFE_INTEGER,
    min: 0
  },
  cacheHitRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  errorRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  lastExecuted: {
    type: Date,
    default: Date.now,
    index: true
  },
  complexityScore: {
    type: Number,
    default: 0,
    min: 0
  },
  totalErrors: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCacheHits: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Indexes for performance tracking
FormulaPerformanceSchema.index({ averageExecutionTime: -1 });
FormulaPerformanceSchema.index({ errorRate: -1 });
FormulaPerformanceSchema.index({ complexityScore: -1 });

// Static methods for formula performance
FormulaPerformanceSchema.statics.recordExecution = async function (
  formulaId: string,
  executionTime: number,
  success: boolean
): Promise<void> {
  const update: any = {
    $inc: {
      totalExecutions: 1,
      ...(success ? {} : { totalErrors: 1 })
    },
    $set: {
      lastExecuted: new Date()
    }
  };

  // Update execution time statistics
  const existing = await (this as TFormulaPerformanceModel).findOne({ formulaId });
  if (existing) {
    const newTotal = existing.totalExecutions + 1;
    const newAverage =
      (existing.averageExecutionTime * existing.totalExecutions + executionTime) / newTotal;

    update.$set = {
      ...update.$set,
      averageExecutionTime: newAverage,
      maxExecutionTime: Math.max(existing.maxExecutionTime, executionTime),
      minExecutionTime: Math.min(existing.minExecutionTime, executionTime),
      errorRate: (existing.totalErrors + (success ? 0 : 1)) / newTotal
    };
  } else {
    update.$set = {
      ...update.$set,
      averageExecutionTime: executionTime,
      maxExecutionTime: executionTime,
      minExecutionTime: executionTime,
      errorRate: success ? 0 : 1
    };
  }

  await (this as TFormulaPerformanceModel).findOneAndUpdate({ formulaId }, update, { upsert: true });
};

FormulaPerformanceSchema.statics.getPerformanceStats = function (formulaId: string): Promise<TFormulaPerformanceDocument | null> {
  return (this as TFormulaPerformanceModel).findOne({ formulaId });
};

FormulaPerformanceSchema.statics.getSlowFormulas = function (limit = 10): Promise<TFormulaPerformanceDocument[]> {
  return (this as TFormulaPerformanceModel)
    .find({})
    .sort({ averageExecutionTime: -1 })
    .limit(limit)
    .populate('formulaId');
};

FormulaPerformanceSchema.statics.getErrorProneFormulas = function (limit = 10): Promise<TFormulaPerformanceDocument[]> {
  return (this as TFormulaPerformanceModel)
    .find({ errorRate: { $gt: 0 } })
    .sort({ errorRate: -1 })
    .limit(limit)
    .populate('formulaId');
};

// Create models
export const FormulaPropertyModel = mongoose.model<TFormulaPropertyDocument, TFormulaPropertyModel>(
  'FormulaProperty',
  FormulaPropertySchema
);

export const FormulaCacheModel = mongoose.model<TFormulaCacheDocument, TFormulaCacheModel>(
  'FormulaCache',
  FormulaCacheSchema
);

export const FormulaPerformanceModel = mongoose.model<
  TFormulaPerformanceDocument,
  TFormulaPerformanceModel
>('FormulaPerformance', FormulaPerformanceSchema);
