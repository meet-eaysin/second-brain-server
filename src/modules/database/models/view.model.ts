import mongoose, { Schema, Model } from 'mongoose';
import { IView, EViewType, ISortConfig, IFilterCondition } from '@/modules/core/types/view.types';
import { createBaseSchema, IBaseDocument } from '@/modules/core/models/base.model';

export type TViewDocument = IView & IBaseDocument;

export type TViewModel = Model<TViewDocument> & {
  findByDatabase(databaseId: string): Promise<TViewDocument[]>;
  findDefaultView(databaseId: string): Promise<TViewDocument | null>;
  findPublicViews(databaseId: string): Promise<TViewDocument[]>;
};

const SortConfigSchema = new Schema(
  {
    propertyId: {
      type: String,
      required: true
    },
    direction: {
      type: String,
      enum: ['asc', 'desc'],
      required: true
    }
  },
  { _id: false }
);

const FilterGroupSchema = new Schema(
  {
    operator: {
      type: String,
      enum: ['and', 'or'],
      required: true
    },
    conditions: {
      type: [Schema.Types.Mixed],
      default: []
    }
  },
  { _id: false }
);

const ColumnConfigSchema = new Schema(
  {
    propertyId: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      min: 50
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      required: true,
      min: 0
    },
    isFrozen: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const GroupConfigSchema = new Schema(
  {
    propertyId: {
      type: String,
      required: true
    },
    hideEmpty: {
      type: Boolean,
      default: false
    },
    sortGroups: {
      type: String,
      enum: ['asc', 'desc', 'manual']
    }
  },
  { _id: false }
);

const CalendarConfigSchema = new Schema(
  {
    datePropertyId: {
      type: String,
      required: true
    },
    endDatePropertyId: {
      type: String
    },
    showWeekends: {
      type: Boolean,
      default: true
    },
    defaultView: {
      type: String,
      enum: ['month', 'week', 'day'],
      default: 'month'
    }
  },
  { _id: false }
);

const GalleryConfigSchema = new Schema(
  {
    coverPropertyId: {
      type: String
    },
    cardSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    showProperties: [String]
  },
  { _id: false }
);

const TimelineConfigSchema = new Schema(
  {
    startDatePropertyId: {
      type: String,
      required: true
    },
    endDatePropertyId: {
      type: String
    },
    groupByPropertyId: {
      type: String
    },
    showDependencies: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const ViewConfigSchema = new Schema(
  {
    pageSize: {
      type: Number,
      min: 1,
      max: 100,
      default: 25
    },
    columns: [ColumnConfigSchema],
    group: GroupConfigSchema,
    calendar: CalendarConfigSchema,
    gallery: GalleryConfigSchema,
    timeline: TimelineConfigSchema,
    visibleProperties: {
      type: [String],
      default: []
    },
    hiddenProperties: {
      type: [String],
      default: []
    },
    frozenColumns: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const ViewSchema = createBaseSchema({
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
    enum: Object.values(EViewType),
    required: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  config: {
    type: ViewConfigSchema,
    default: {}
  },
  sorts: {
    type: [SortConfigSchema],
    default: []
  },
  filters: {
    type: FilterGroupSchema,
    default: { operator: 'and', conditions: [] }
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
ViewSchema.index({ databaseId: 1, order: 1 });
ViewSchema.index({ databaseId: 1, name: 1 });
ViewSchema.index({ databaseId: 1, type: 1 });
ViewSchema.index({ databaseId: 1, isDefault: 1 });
ViewSchema.index({ databaseId: 1, isPublic: 1 });

// Unique constraint for view names within a database
ViewSchema.index({ databaseId: 1, name: 1 }, { unique: true });

// Ensure only one default view per database
ViewSchema.index(
  { databaseId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true }
  }
);

// Static methods
ViewSchema.statics.findByDatabase = function (databaseId: string) {
  return this.find({ databaseId }).notDeleted().sort({ order: 1 }).exec();
};

ViewSchema.statics.findDefaultView = function (databaseId: string) {
  return this.findOne({ databaseId, isDefault: true }).notDeleted().exec();
};

ViewSchema.statics.findPublicViews = function (databaseId: string) {
  return this.find({ databaseId, isPublic: true }).notDeleted().sort({ order: 1 }).exec();
};

// Instance methods
ViewSchema.methods.updateOrder = function (newOrder: number) {
  this.order = newOrder;
  return this.save();
};

ViewSchema.methods.makeDefault = async function () {
  // Remove default from other views in the same database
  await ViewModel.updateMany(
    { databaseId: this.databaseId, _id: { $ne: this._id } },
    { isDefault: false }
  );

  this.isDefault = true;
  return this.save();
};

ViewSchema.methods.addSort = function (sort: ISortConfig) {
  this.sorts.push(sort);
  this.markModified('sorts');
  return this.save();
};

ViewSchema.methods.removeSort = function (propertyId: string) {
  this.sorts = this.sorts.filter((sort: ISortConfig) => sort.propertyId !== propertyId);
  this.markModified('sorts');
  return this.save();
};

ViewSchema.methods.updateSort = function (propertyId: string, direction: 'asc' | 'desc') {
  const sort = this.sorts.find((s: ISortConfig) => s.propertyId === propertyId);
  if (sort) {
    sort.direction = direction;
  } else {
    this.sorts.push({ propertyId, direction });
  }
  this.markModified('sorts');
  return this.save();
};

ViewSchema.methods.addFilter = function (condition: IFilterCondition) {
  if (!this.filters.conditions) {
    this.filters.conditions = [];
  }
  this.filters.conditions.push(condition);
  this.markModified('filters');
  return this.save();
};

ViewSchema.methods.removeFilter = function (index: number) {
  if (this.filters.conditions && this.filters.conditions[index]) {
    this.filters.conditions.splice(index, 1);
    this.markModified('filters');
  }
  return this.save();
};

ViewSchema.methods.clearFilters = function () {
  this.filters = { operator: 'and', conditions: [] };
  this.markModified('filters');
  return this.save();
};

// Pre-save middleware
ViewSchema.pre('save', function (next) {
  // Auto-set order if not provided
  if (this.isNew && this.order === undefined) {
    ViewModel.countDocuments({ databaseId: this.databaseId })
      .then(count => {
        this.order = count;
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Pre-save middleware to ensure default view logic
ViewSchema.pre('save', async function (next) {
  if (this.isDefault) {
    // If this is being set as default, remove default from others
    await ViewModel.updateMany(
      {
        databaseId: this.databaseId,
        _id: { $ne: this._id },
        isDefault: true
      },
      { isDefault: false }
    );
  }
  next();
});

export const ViewModel = mongoose.model<TViewDocument, TViewModel>('View', ViewSchema);
