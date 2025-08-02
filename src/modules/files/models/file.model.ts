import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  description?: string;
  category?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'general',
      index: true
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'files'
  }
);

// Indexes for better query performance
FileSchema.index({ userId: 1, createdAt: -1 });
FileSchema.index({ userId: 1, category: 1 });
FileSchema.index({ userId: 1, mimeType: 1 });
FileSchema.index({ isPublic: 1 });

export const FileModel = mongoose.model<IFile>('File', FileSchema);
