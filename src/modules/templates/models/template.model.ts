import mongoose, { Schema, Model } from 'mongoose';
import {
  IRowTemplate,
  IDatabaseTemplate,
  IWorkspaceTemplate,
  ETemplateCategory,
  ETemplateType,
  ETemplateAccess
} from '../types/template.types';
import {
  createBaseSchema,
  IBaseDocument,
  ISoftDeleteDocument
} from '@/modules/core/models/base.model';
import { EDatabaseType } from '@/modules/database';

// Template document interface that includes all possible properties
export interface ITemplateDocument extends IBaseDocument, ISoftDeleteDocument {
  // Base template properties
  name: string;
  description: string;
  category: ETemplateCategory;
  type: ETemplateType;
  access: ETemplateAccess;
  tags: string[];
  icon?: string;
  color?: string;
  preview?: string;
  usageCount: number;
  rating: number;
  ratingCount: number;
  isOfficial: boolean;
  isFeatured: boolean;

  // Optional properties that may exist based on template type
  moduleType?: EDatabaseType;

  // Row template properties
  defaultValues?: Record<string, any>;
  requiredProperties?: string[];
  conditionalLogic?: any[];
  autoFillRules?: any[];

  // Database template properties
  properties?: any[];
  views?: any[];
  relations?: any[];
  rowTemplates?: any[];
  sampleData?: Record<string, any>[];
  settings?: any;

  // Workspace template properties
  modules?: EDatabaseType[];
  databases?: any[];
  crossModuleRelations?: any[];
  workspaceSettings?: any;
  onboardingFlow?: any[];
}

// Template document types
export type TTemplateDocument = ITemplateDocument;
export type TRowTemplateDocument = IRowTemplate & IBaseDocument & ISoftDeleteDocument;
export type TDatabaseTemplateDocument = IDatabaseTemplate & IBaseDocument & ISoftDeleteDocument;
export type TWorkspaceTemplateDocument = IWorkspaceTemplate & IBaseDocument & ISoftDeleteDocument;

// Template model interface
export type TTemplateModel = Model<TTemplateDocument> & {
  findByCategory(
    category: ETemplateCategory
  ): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  findByType(type: ETemplateType): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  findByModule(moduleType: EDatabaseType): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  findFeatured(): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  findOfficial(): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  findPublic(): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  findByUser(userId: string): mongoose.Query<TTemplateDocument[], TTemplateDocument>;
  searchTemplates(query: any): Promise<{ templates: TTemplateDocument[]; total: number }>;
  incrementUsage(templateId: string): Promise<void>;
  updateRating(templateId: string, rating: number): Promise<void>;
};

// Conditional logic schema
const ConditionSchema = new Schema(
  {
    property: { type: String, required: true },
    operator: {
      type: String,
      enum: [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'greater_than',
        'less_than',
        'is_empty',
        'is_not_empty'
      ],
      required: true
    },
    value: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const ActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['set_value', 'show_property', 'hide_property', 'set_required', 'set_optional'],
      required: true
    },
    target: { type: String, required: true },
    value: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const ConditionalLogicSchema = new Schema(
  {
    condition: { type: ConditionSchema, required: true },
    actions: { type: [ActionSchema], required: true }
  },
  { _id: false }
);

// Auto-fill rule schema
const AutoFillRuleSchema = new Schema(
  {
    sourceProperty: { type: String, required: true },
    targetProperty: { type: String, required: true },
    transformation: {
      type: String,
      enum: ['uppercase', 'lowercase', 'capitalize', 'slug', 'date_format', 'custom']
    },
    customFunction: { type: String }
  },
  { _id: false }
);

// Validation rule schema
const ValidationRuleSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['required', 'min_length', 'max_length', 'pattern', 'custom'],
      required: true
    },
    value: { type: Schema.Types.Mixed },
    message: { type: String, required: true }
  },
  { _id: false }
);

// Template property schema
const TemplatePropertySchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    type: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    config: { type: Schema.Types.Mixed, default: {} },
    isRequired: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    defaultValue: { type: Schema.Types.Mixed },
    validationRules: { type: [ValidationRuleSchema], default: [] }
  },
  { _id: false }
);

// Template view schema
const TemplateViewSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    type: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    isDefault: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    settings: { type: Schema.Types.Mixed, default: {} },
    filters: { type: [Schema.Types.Mixed], default: [] },
    sorts: { type: [Schema.Types.Mixed], default: [] },
    groups: { type: [Schema.Types.Mixed], default: [] }
  },
  { _id: false }
);

// Template relation schema
const TemplateRelationSchema = new Schema(
  {
    sourceProperty: { type: String, required: true },
    targetModule: { type: String, enum: Object.values(EDatabaseType), required: true },
    targetProperty: { type: String, required: true },
    type: {
      type: String,
      enum: ['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'],
      required: true
    },
    isRequired: { type: Boolean, default: false },
    cascadeDelete: { type: Boolean, default: false }
  },
  { _id: false }
);

// Cross-module relation schema
const CrossModuleRelationSchema = new Schema(
  {
    sourceModule: { type: String, enum: Object.values(EDatabaseType), required: true },
    targetModule: { type: String, enum: Object.values(EDatabaseType), required: true },
    sourceProperty: { type: String, required: true },
    targetProperty: { type: String, required: true },
    type: {
      type: String,
      enum: ['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'],
      required: true
    },
    isRequired: { type: Boolean, default: false },
    cascadeDelete: { type: Boolean, default: false }
  },
  { _id: false }
);

// Database settings schema
const DatabaseSettingsSchema = new Schema(
  {
    allowComments: { type: Boolean, default: true },
    allowDuplicates: { type: Boolean, default: true },
    enableVersioning: { type: Boolean, default: false },
    enableAuditLog: { type: Boolean, default: true },
    enableAutoTagging: { type: Boolean, default: false },
    enableSmartSuggestions: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false }
  },
  { _id: false }
);

// Workspace settings schema
const WorkspaceSettingsSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    icon: { type: String },
    color: { type: String },
    isPublic: { type: Boolean, default: false },
    allowInvites: { type: Boolean, default: true },
    defaultPermissions: { type: String, default: 'read' },
    features: { type: [String], default: [] }
  },
  { _id: false }
);

// Onboarding step schema
const OnboardingActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['create_record', 'show_tooltip', 'highlight_element', 'open_modal'],
      required: true
    },
    target: { type: String },
    data: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const OnboardingStepSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    type: {
      type: String,
      enum: ['welcome', 'setup', 'tutorial', 'completion'],
      required: true
    },
    order: { type: Number, required: true },
    isRequired: { type: Boolean, default: true },
    actions: { type: [OnboardingActionSchema], default: [] }
  },
  { _id: false }
);

// Main template schema
const TemplateSchema = createBaseSchema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: Object.values(ETemplateCategory),
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(ETemplateType),
    required: true,
    index: true
  },
  access: {
    type: String,
    enum: Object.values(ETemplateAccess),
    required: true,
    default: ETemplateAccess.PRIVATE,
    index: true
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  icon: {
    type: String
  },
  color: {
    type: String
  },
  preview: {
    type: String
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isOfficial: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  // Row template specific fields
  moduleType: {
    type: String,
    enum: Object.values(EDatabaseType),
    index: true
  },
  defaultValues: {
    type: Schema.Types.Mixed,
    default: {}
  },
  requiredProperties: {
    type: [String],
    default: []
  },
  conditionalLogic: {
    type: [ConditionalLogicSchema],
    default: []
  },
  autoFillRules: {
    type: [AutoFillRuleSchema],
    default: []
  },

  // Database template specific fields
  properties: {
    type: [TemplatePropertySchema],
    default: []
  },
  views: {
    type: [TemplateViewSchema],
    default: []
  },
  relations: {
    type: [TemplateRelationSchema],
    default: []
  },
  rowTemplates: {
    type: [Schema.Types.Mixed], // References to row templates
    default: []
  },
  sampleData: {
    type: [Schema.Types.Mixed],
    default: []
  },
  settings: {
    type: DatabaseSettingsSchema
  },

  // Workspace template specific fields
  modules: {
    type: [String],
    default: []
  },
  databases: {
    type: [Schema.Types.Mixed], // References to database templates
    default: []
  },
  crossModuleRelations: {
    type: [CrossModuleRelationSchema],
    default: []
  },
  workspaceSettings: {
    type: WorkspaceSettingsSchema
  },
  onboardingFlow: {
    type: [OnboardingStepSchema],
    default: []
  }
});

// Indexes for better performance
TemplateSchema.index({ name: 'text', description: 'text', tags: 'text' });
TemplateSchema.index({ category: 1, type: 1 });
TemplateSchema.index({ moduleType: 1, type: 1 });
TemplateSchema.index({ access: 1, isOfficial: 1, isFeatured: 1 });
TemplateSchema.index({ usageCount: -1, rating: -1 });
TemplateSchema.index({ createdBy: 1, type: 1 });

// Static methods
TemplateSchema.statics.findByCategory = function (category: ETemplateCategory) {
  return this.find({ category, isDeleted: { $ne: true } });
};

TemplateSchema.statics.findByType = function (type: ETemplateType) {
  return this.find({ type, isDeleted: { $ne: true } });
};

TemplateSchema.statics.findByModule = function (moduleType: EDatabaseType) {
  return this.find({ moduleType, isDeleted: { $ne: true } });
};

TemplateSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true, isDeleted: { $ne: true } }).sort({
    usageCount: -1,
    rating: -1
  });
};

TemplateSchema.statics.findOfficial = function () {
  return this.find({ isOfficial: true, isDeleted: { $ne: true } }).sort({
    usageCount: -1,
    rating: -1
  });
};

TemplateSchema.statics.findPublic = function () {
  return this.find({ access: ETemplateAccess.PUBLIC, isDeleted: { $ne: true } }).sort({
    usageCount: -1,
    rating: -1
  });
};

TemplateSchema.statics.findByUser = function (userId: string) {
  return this.find({ createdBy: userId, isDeleted: { $ne: true } }).sort({ updatedAt: -1 });
};

TemplateSchema.statics.searchTemplates = async function (query: any) {
  const filter: any = { isDeleted: { $ne: true } };

  // Build search filter
  if (query.query) {
    filter.$text = { $search: query.query };
  }

  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  if (query.moduleType) filter.moduleType = query.moduleType;
  if (query.access) filter.access = query.access;
  if (query.isOfficial !== undefined) {
    filter.isOfficial = query.isOfficial === 'true' || query.isOfficial === true;
  }
  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured === 'true' || query.isFeatured === true;
  }
  if (query.minRating) filter.rating = { $gte: query.minRating };

  if (query.tags && query.tags.length > 0) {
    filter.tags = { $in: query.tags };
  }

  // Build sort
  const sort: any = {};
  if (query.sortBy) {
    const direction = query.sortOrder === 'desc' ? -1 : 1;
    sort[query.sortBy] = direction;
  } else {
    sort.usageCount = -1;
    sort.rating = -1;
  }

  // Execute query
  const total = await this.countDocuments(filter);
  const templates = await this.find(filter)
    .sort(sort)
    .limit(query.limit || 20)
    .skip(query.offset || 0);

  return { templates, total };
};

TemplateSchema.statics.incrementUsage = async function (templateId: string) {
  await this.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });
};

TemplateSchema.statics.updateRating = async function (templateId: string, rating: number) {
  const template = await this.findById(templateId);
  if (template) {
    const newRatingCount = template.ratingCount + 1;
    const newRating = (template.rating * template.ratingCount + rating) / newRatingCount;

    await this.findByIdAndUpdate(templateId, {
      rating: newRating,
      ratingCount: newRatingCount
    });
  }
};

// Create and export the model
export const TemplateModel = mongoose.model<TTemplateDocument, TTemplateModel>(
  'Template',
  TemplateSchema
);
