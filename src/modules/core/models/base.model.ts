import { Document, Schema, Query } from 'mongoose';

export interface QueryHelpers {
  notDeleted<T>(this: Query<T[], T>): Query<T[], T>;
  deleted<T>(this: Query<T[], T>): Query<T[], T>;
  notArchived<T>(this: Query<T[], T>): Query<T[], T>;
  archived<T>(this: Query<T[], T>): Query<T[], T>;
  active<T>(this: Query<T[], T>): Query<T[], T>;
}

export const SoftDeleteSchema = new Schema({
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    index: true
  },
  deletedBy: {
    type: String
  }
});

export const ArchivableSchema = new Schema({
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date,
    index: true
  },
  archivedBy: {
    type: String
  }
});

export const TaggableSchema = new Schema({
  tags: {
    type: [String],
    default: [],
    index: true
  }
});

export const SearchableSchema = new Schema({
  searchText: {
    type: String,
    index: true
  }
});

export interface IBaseDocument extends Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface ISoftDeleteDocument extends IBaseDocument {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface IArchivableDocument extends IBaseDocument {
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: string;
}

export interface ITaggableDocument extends IBaseDocument {
  tags: string[];
}

export interface ISearchableDocument extends IBaseDocument {
  searchText?: string;
}

export interface IFullDocument
  extends IBaseDocument,
    ISoftDeleteDocument,
    IArchivableDocument,
    ITaggableDocument,
    ISearchableDocument {}

export const addBaseSchema = (schema: Schema) => {
  schema.add({
    createdBy: {
      type: String,
      required: true,
      index: true
    },
    updatedBy: {
      type: String,
      index: true
    }
  });
  return schema;
};

export const addSoftDelete = (schema: Schema) => {
  schema.add(SoftDeleteSchema.obj);
  return schema;
};

export const addArchivable = (schema: Schema) => {
  schema.add(ArchivableSchema.obj);
  return schema;
};

export const addTaggable = (schema: Schema) => {
  schema.add(TaggableSchema.obj);
  return schema;
};

export const addSearchable = (schema: Schema) => {
  schema.add(SearchableSchema.obj);
  return schema;
};

export const updateSearchText = function (this: any, next: any) {
  if (this.isModified()) {
    const searchFields: string[] = [];

    if (this.name) searchFields.push(this.name);
    if (this.title) searchFields.push(this.title);
    if (this.description) searchFields.push(this.description);
    if (this.content) searchFields.push(this.content);
    if (this.tags && Array.isArray(this.tags)) searchFields.push(...this.tags);

    if (this.properties && typeof this.properties === 'object') {
      Object.values(this.properties).forEach((value: any) => {
        if (typeof value === 'string') {
          searchFields.push(value);
        } else if (Array.isArray(value)) {
          value.forEach((item: any) => {
            if (typeof item === 'string') searchFields.push(item);
            if (item && typeof item === 'object' && item.label) searchFields.push(item.label);
          });
        } else if (value && typeof value === 'object' && value.label) {
          searchFields.push(value.label);
        }
      });
    }

    this.searchText = searchFields.join(' ').toLowerCase();
  }
  next();
};

export const addCommonIndexes = (schema: Schema) => {
  schema.index({ createdBy: 1, createdAt: -1 });
  schema.index({ updatedAt: -1 });
  schema.index({ isDeleted: 1, isArchived: 1 });
  schema.index({ searchText: 'text' });
  return schema;
};

export const addSoftDeleteQueries = (schema: Schema<any, any, QueryHelpers>) => {
  const queryHelpers = schema.query as any;

  queryHelpers.notDeleted = function <U>(this: Query<U[], U>) {
    return this.where({ isDeleted: { $ne: true } });
  };

  queryHelpers.deleted = function <U>(this: Query<U[], U>) {
    return this.where({ isDeleted: true });
  };

  queryHelpers.notArchived = function <U>(this: Query<U[], U>) {
    return this.where({ isArchived: { $ne: true } });
  };

  queryHelpers.archived = function <U>(this: Query<U[], U>) {
    return this.where({ isArchived: true });
  };

  queryHelpers.active = function <U>(this: Query<U[], U>) {
    return this.where({
      isDeleted: { $ne: true },
      isArchived: { $ne: true }
    });
  };

  return schema;
};

export const addSoftDeleteMethods = (schema: Schema) => {
  schema.methods.softDelete = function (deletedBy?: string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedBy) this.deletedBy = deletedBy;
    return this.save();
  };

  schema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    return this.save();
  };

  schema.methods.archive = function (archivedBy?: string) {
    this.isArchived = true;
    this.archivedAt = new Date();
    if (archivedBy) this.archivedBy = archivedBy;
    return this.save();
  };

  schema.methods.unarchive = function () {
    this.isArchived = false;
    this.archivedAt = undefined;
    this.archivedBy = undefined;
    return this.save();
  };

  return schema;
};

export const createBaseSchema = (additionalFields?: any): Schema<any, any, QueryHelpers> => {
  const schema = new Schema(additionalFields || {}, {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc: Document, ret: Record<string, unknown>) => {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        if ('__v' in ret) {
          delete ret.__v;
        }
        return ret;
      }
    }
  }) as Schema<any, any, QueryHelpers>;

  addBaseSchema(schema);
  addSoftDelete(schema);
  addArchivable(schema);
  addTaggable(schema);
  addSearchable(schema);
  addCommonIndexes(schema);
  addSoftDeleteQueries(schema);
  addSoftDeleteMethods(schema);

  schema.pre('save', updateSearchText);

  return schema;
};
