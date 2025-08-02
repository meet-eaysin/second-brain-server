import mongoose, { Schema, Document } from 'mongoose';

export interface ITag {
  id: string;
  name: string;
  color: string;
  description?: string;
  userId: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagDocument extends ITag, Document {
  _id: mongoose.Types.ObjectId;
}

const TagSchema = new Schema<ITagDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i,
      default: '#3B82F6'
    },
    description: {
      type: String,
      maxlength: 200,
      trim: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Indexes
TagSchema.index({ userId: 1, name: 1 }, { unique: true });
TagSchema.index({ userId: 1, usageCount: -1 });
TagSchema.index({ name: 'text', description: 'text' });

export const TagModel = mongoose.model<ITagDocument>('Tag', TagSchema);
