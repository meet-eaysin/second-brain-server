import mongoose, { Schema, Model } from 'mongoose';
import { EContentBlockType, IRecordContent, IRichText } from '@/modules/core/types/record.types';
import { TPropertyValue } from '@/modules/core/types/property.types';
import { createBaseSchema, IBaseDocument, ISoftDeleteDocument, QueryHelpers } from '@/modules/core/models/base.model';

// Properly typed document interface
export interface IRecordDocument extends IBaseDocument, ISoftDeleteDocument {
  // Record properties (from IRecord but without id conflict)
  databaseId: string;
  properties: Record<string, TPropertyValue>;

  // Rich content (like Notion page content)
  content?: IRecordContent[];

  // Ordering
  order?: number;

  // Metadata
  isTemplate: boolean;
  isFavorite: boolean;
  isArchived: boolean;

  // Collaboration
  lastEditedBy?: string;
  lastEditedAt?: Date;

  // Comments and discussions
  commentCount: number;

  // Version control (if enabled)
  version: number;

  // AI features
  autoTags?: string[];
  aiSummary?: string;

  // Relations cache (for performance)
  relationsCache?: Record<string, unknown[]>;

  // Virtual properties
  searchText?: string;

  // Instance methods
  updateProperty(propertyId: string, value: TPropertyValue): Promise<this>;
  removeProperty(propertyId: string): Promise<this>;
  toggleFavorite(): Promise<this>;
  incrementVersion(): Promise<this>;
  addContent(content: IRecordContent): Promise<this>;
  updateContent(contentId: string, updates: Partial<IRecordContent>): Promise<this>;
  removeContent(contentId: string): Promise<this>;
  addAutoTag(tag: string): Promise<this>;
  removeAutoTag(tag: string): Promise<this>;
  updateRelationCache(propertyId: string, relatedRecords: unknown[]): Promise<this>;
  updateSearchText(): void;

  // Soft delete methods (from base schema)
  softDelete(deletedBy?: string): Promise<this>;
  restore(): Promise<this>;
}

export type TRecordDocument = IRecordDocument & IBaseDocument;

export type TRecordModel = Model<TRecordDocument, QueryHelpers> & {
  findByDatabase(databaseId: string): Promise<TRecordDocument[]>;
  findTemplates(databaseId: string): Promise<TRecordDocument[]>;
  findFavorites(databaseId: string, userId: string): Promise<TRecordDocument[]>;
  findByProperty(databaseId: string, propertyId: string, value: any): Promise<TRecordDocument[]>;
};

const RichTextSchema = new Schema({
  type: {
    type: String,
    enum: ['text', 'mention', 'equation'],
    required: true
  },
  text: {
    content: String,
    link: {
      url: String
    }
  },
  mention: {
    type: {
      type: String,
      enum: ['user', 'page', 'database', 'date']
    },
    user: { id: String },
    page: { id: String },
    database: { id: String },
    date: {
      start: String,
      end: String
    }
  },
  equation: {
    expression: String
  },
  annotations: {
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    strikethrough: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
    code: { type: Boolean, default: false },
    color: { type: String, default: 'default' }
  },
  plain_text: {
    type: String,
    required: true
  },
  href: String
}, { _id: false });

const RecordContentSchema: any = new Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(EContentBlockType),
    required: true
  },
  content: [RichTextSchema],
  children: [Schema.Types.Mixed], // Self-referencing

  // Block-specific properties
  checked: Boolean, // for to_do
  language: String, // for code
  caption: [RichTextSchema], // for image, video, file
  url: String, // for image, video, file, bookmark, embed

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  },
  lastEditedAt: {
    type: Date,
    default: Date.now
  },
  lastEditedBy: {
    type: String,
    required: true
  }
}, { _id: false });

const RecordSchema = createBaseSchema({
  databaseId: {
    type: String,
    required: true,
    index: true
  },
  properties: {
    type: Schema.Types.Mixed,
    default: {},
    index: true
  },

  // Rich content (like Notion page content)
  content: [RecordContentSchema],

  // Ordering
  order: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },

  // Metadata
  isTemplate: {
    type: Boolean,
    default: false,
    index: true
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },

  // Collaboration
  lastEditedBy: {
    type: String,
    index: true
  },
  lastEditedAt: {
    type: Date,
    index: true
  },

  // Comments and discussions
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Version control (if enabled)
  version: {
    type: Number,
    default: 1,
    min: 1
  },

  // AI features
  autoTags: [String],
  aiSummary: String,

  // Relations cache (for performance)
  relationsCache: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

// Indexes
RecordSchema.index({ databaseId: 1, createdAt: -1 });
RecordSchema.index({ databaseId: 1, updatedAt: -1 });
RecordSchema.index({ databaseId: 1, isTemplate: 1 });
RecordSchema.index({ databaseId: 1, isFavorite: 1 });
RecordSchema.index({ databaseId: 1, lastEditedAt: -1 });
RecordSchema.index({ createdBy: 1, databaseId: 1 });
RecordSchema.index({ 'properties': 1 });
RecordSchema.index({ 'autoTags': 1 });

// Text search index
RecordSchema.index({
  'searchText': 'text',
  'properties': 'text',
  'aiSummary': 'text'
});

// Static methods
RecordSchema.statics.findByDatabase = function(databaseId: string) {
  return this.find({ databaseId }).notDeleted().notArchived().sort({ updatedAt: -1 }).exec();
};

RecordSchema.statics.findTemplates = function(databaseId: string) {
  return this.find({ databaseId, isTemplate: true }).notDeleted().sort({ createdAt: -1 }).exec();
};

RecordSchema.statics.findFavorites = function(databaseId: string, userId: string) {
  return this.find({
    databaseId,
    isFavorite: true,
    $or: [
      { createdBy: userId }
      // Include records that user has permission to view
      // Note: Additional permission filtering should be done at service level
    ]
  }).notDeleted().notArchived().sort({ updatedAt: -1 }).exec();
};

RecordSchema.statics.findByProperty = function(databaseId: string, propertyId: string, value: any) {
  const query: any = { databaseId };
  query[`properties.${propertyId}`] = value;
  return this.find(query).notDeleted().notArchived().exec();
};

// Instance methods
RecordSchema.methods.updateProperty = function(propertyId: string, value: any) {
  if (!this.properties) {
    this.properties = {};
  }
  this.properties[propertyId] = value;
  this.lastEditedAt = new Date();
  this.markModified('properties');
  return this.save();
};

RecordSchema.methods.removeProperty = function(propertyId: string) {
  if (this.properties && this.properties[propertyId] !== undefined) {
    delete this.properties[propertyId];
    this.lastEditedAt = new Date();
    this.markModified('properties');
  }
  return this.save();
};

RecordSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

RecordSchema.methods.incrementVersion = function() {
  this.version += 1;
  this.lastEditedAt = new Date();
  return this.save();
};

RecordSchema.methods.addContent = function(content: any) {
  if (!this.content) {
    this.content = [];
  }
  this.content.push(content);
  this.lastEditedAt = new Date();
  this.markModified('content');
  return this.save();
};

RecordSchema.methods.updateContent = function(contentId: string, updates: Partial<IRecordContent>) {
  if (this.content) {
    const contentIndex = this.content.findIndex((c: IRecordContent) => c.id === contentId);
    if (contentIndex !== -1) {
      Object.assign(this.content[contentIndex], updates);
      this.content[contentIndex].lastEditedAt = new Date();
      this.lastEditedAt = new Date();
      this.markModified('content');
    }
  }
  return this.save();
};

RecordSchema.methods.removeContent = function(contentId: string) {
  if (this.content) {
    this.content = this.content.filter((c: IRecordContent) => c.id !== contentId);
    this.lastEditedAt = new Date();
    this.markModified('content');
  }
  return this.save();
};

RecordSchema.methods.addAutoTag = function(tag: string) {
  if (!this.autoTags) {
    this.autoTags = [];
  }
  if (!this.autoTags.includes(tag)) {
    this.autoTags.push(tag);
    this.markModified('autoTags');
  }
  return this.save();
};

RecordSchema.methods.removeAutoTag = function(tag: string) {
  if (this.autoTags) {
    this.autoTags = this.autoTags.filter((t: string) => t !== tag);
    this.markModified('autoTags');
  }
  return this.save();
};

RecordSchema.methods.updateRelationCache = function(propertyId: string, relatedRecords: any[]) {
  if (!this.relationsCache) {
    this.relationsCache = {};
  }
  this.relationsCache[propertyId] = relatedRecords;
  this.markModified('relationsCache');
  return this.save();
};

// Pre-save middleware
RecordSchema.pre('save', function(next) {
  // Update lastEditedAt and lastEditedBy if properties or content changed
  if (this.isModified('properties') || this.isModified('content')) {
    this.lastEditedAt = new Date();
    // lastEditedBy should be set by the calling code
  }

  // Update search text
  if (this.isModified('properties') || this.isModified('content') || this.isModified('aiSummary')) {
    (this as unknown as IRecordDocument).updateSearchText();
  }

  next();
});

// Method to update search text
RecordSchema.methods.updateSearchText = function() {
  const searchFields: string[] = [];

  // Add property values
  if (this.properties) {
    Object.values(this.properties).forEach((value: unknown) => {
      if (typeof value === 'string') {
        searchFields.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((item: unknown) => {
          if (typeof item === 'string') {
            searchFields.push(item);
          } else if (item && typeof item === 'object' && 'label' in item && typeof item.label === 'string') {
            searchFields.push(item.label);
          }
        });
      } else if (value && typeof value === 'object' && 'label' in value && typeof value.label === 'string') {
        searchFields.push(value.label);
      }
    });
  }

  // Add content text
  if (this.content) {
    this.content.forEach((block: IRecordContent) => {
      if (block.content) {
        block.content.forEach((richText: IRichText) => {
          if (richText.plain_text) {
            searchFields.push(richText.plain_text);
          }
        });
      }
    });
  }

  // Add AI summary
  if (this.aiSummary) {
    searchFields.push(this.aiSummary);
  }

  // Add auto tags
  if (this.autoTags) {
    searchFields.push(...this.autoTags);
  }

  this.searchText = searchFields.join(' ').toLowerCase();
};

export const RecordModel = mongoose.model<TRecordDocument, TRecordModel>('Record', RecordSchema);
