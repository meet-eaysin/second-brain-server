import mongoose, { Schema, Document } from 'mongoose';

export interface IDatabaseCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDatabaseCategoryDocument extends Document {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const DatabaseCategorySchema = new Schema<IDatabaseCategoryDocument>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String, 
      maxlength: 500,
      trim: true
    },
    icon: { 
      type: String, 
      maxlength: 50,
      trim: true
    },
    color: { 
      type: String, 
      maxlength: 50,
      trim: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    ownerId: { 
      type: String, 
      required: true, 
      index: true 
    },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
    sortOrder: { 
      type: Number, 
      default: 0 
    }
  },
  {
    timestamps: true,
    collection: 'database_categories'
  }
);

// Indexes for performance
DatabaseCategorySchema.index({ ownerId: 1, sortOrder: 1 });
DatabaseCategorySchema.index({ ownerId: 1, name: 1 }, { unique: true });

// Ensure only one default category per user
DatabaseCategorySchema.index(
  { ownerId: 1, isDefault: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isDefault: true } 
  }
);

export const DatabaseCategoryModel = mongoose.model<IDatabaseCategoryDocument>(
  'DatabaseCategory', 
  DatabaseCategorySchema
);
