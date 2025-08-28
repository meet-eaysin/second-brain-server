import mongoose, { Schema, Model } from 'mongoose';
import { IProperty, EPropertyType, IPropertyOption } from '@/modules/core/types/property.types';
import { createBaseSchema, IBaseDocument } from '@/modules/core/models/base.model';

export type TPropertyDocument = IProperty & IBaseDocument;

export type TPropertyModel = Model<TPropertyDocument> & {
  findByDatabase(databaseId: string): Promise<TPropertyDocument[]>;
  findSystemProperties(databaseId: string): Promise<TPropertyDocument[]>;
  findVisibleProperties(databaseId: string): Promise<TPropertyDocument[]>;
};

const PropertyOptionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  color: {
    type: String
  },
  description: {
    type: String
  }
}, { _id: false });

const PropertyConfigSchema = new Schema({
  // For select/multi-select
  options: [PropertyOptionSchema],

  // For number
  format: {
    type: String,
    enum: ['number', 'currency', 'percentage']
  },
  precision: {
    type: Number,
    min: 0,
    max: 10
  },

  // For date
  includeTime: {
    type: Boolean,
    default: false
  },

  // For relation
  relationDatabaseId: {
    type: String
  },
  relationPropertyId: {
    type: String
  },

  // For rollup
  rollupPropertyId: {
    type: String
  },
  rollupFunction: {
    type: String,
    enum: ['count', 'sum', 'average', 'min', 'max', 'latest', 'earliest']
  },

  // For formula
  formula: {
    type: String
  },

  // For file
  allowMultiple: {
    type: Boolean,
    default: true
  },
  allowedTypes: [String],
  maxSize: {
    type: Number,
    min: 1
  },

  // For text/rich_text
  maxLength: {
    type: Number,
    min: 1
  },

  // For URL
  displayText: {
    type: String
  },

  // Validation rules
  required: {
    type: Boolean,
    default: false
  },
  unique: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: Schema.Types.Mixed
  }
}, { _id: false });

const PropertySchema = createBaseSchema({
  databaseId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: Object.values(EPropertyType),
    required: true,
    index: true
  },
  config: {
    type: PropertyConfigSchema,
    default: {}
  },
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  isVisible: {
    type: Boolean,
    default: true,
    index: true
  },
  order: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }
});

// Indexes
PropertySchema.index({ databaseId: 1, order: 1 });
PropertySchema.index({ databaseId: 1, name: 1 });
PropertySchema.index({ databaseId: 1, name: 1 }, { unique: true });
PropertySchema.index({ databaseId: 1, isSystem: 1 });
PropertySchema.index({ databaseId: 1, isVisible: 1 });

// Static methods
PropertySchema.statics.findByDatabase = function(databaseId: string) {
  return this.find({ databaseId }).notDeleted().sort({ order: 1 }).exec();
};

PropertySchema.statics.findSystemProperties = function(databaseId: string) {
  return this.find({ databaseId, isSystem: true }).notDeleted().sort({ order: 1 }).exec();
};

PropertySchema.statics.findVisibleProperties = function(databaseId: string) {
  return this.find({ databaseId, isVisible: true }).notDeleted().sort({ order: 1 }).exec();
};

// Instance methods
PropertySchema.methods.updateOrder = function(newOrder: number) {
  this.order = newOrder;
  return this.save();
};

PropertySchema.methods.toggleVisibility = function() {
  this.isVisible = !this.isVisible;
  return this.save();
};

PropertySchema.methods.addOption = function(option: IPropertyOption) {
  if (!this.config.options) {
    this.config.options = [];
  }
  this.config.options.push(option);
  this.markModified('config.options');
  return this.save();
};

PropertySchema.methods.removeOption = function(optionId: string) {
  if (this.config.options) {
    this.config.options = this.config.options.filter((opt: IPropertyOption) => opt.id !== optionId);
    this.markModified('config.options');
  }
  return this.save();
};

PropertySchema.methods.updateOption = function(optionId: string, updates: Partial<IPropertyOption>) {
  if (this.config.options) {
    const option = this.config.options.find((opt: IPropertyOption) => opt.id === optionId);
    if (option) {
      Object.assign(option, updates);
      this.markModified('config.options');
    }
  }
  return this.save();
};

// Pre-save middleware
PropertySchema.pre('save', function(next: (error?: Error) => void) {
  // Ensure system properties cannot be deleted
  if (this.isSystem && this.isDeleted) {
    const error = new Error('System properties cannot be deleted');
    return next(error);
  }

  // Auto-set order if not provided
  if (this.isNew && this.order === undefined) {
    PropertyModel.countDocuments({ databaseId: this.databaseId })
      .then((count: number) => {
        this.order = count;
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Pre-deleteOne middleware (replaces deprecated 'remove')
PropertySchema.pre('deleteOne', (next: (error?: Error) => void) => {
  // Note: In deleteOne middleware, 'this' refers to the query, not the document
  // For document-level validation, use pre('save') middleware instead
  next();
});

// Pre-findOneAndDelete middleware
PropertySchema.pre('findOneAndDelete', (next: (error?: Error) => void) => {
  // Note: In findOneAndDelete middleware, 'this' refers to the query, not the document
  // For document-level validation, use pre('save') middleware instead
  next();
});

export const PropertyModel = mongoose.model<TPropertyDocument, TPropertyModel>('Property', PropertySchema);
