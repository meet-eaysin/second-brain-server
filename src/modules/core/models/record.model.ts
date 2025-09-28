import mongoose, { Schema, Document } from 'mongoose';

export interface IRecord extends Document {
  id: string;
  data: Record<string, any>;
  databaseId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema = new Schema<IRecord>(
  {
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    databaseId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        const { _id, __v, ...cleanRet } = ret;
        return {
          ...cleanRet,
          id: _id?.toString() || ''
        };
      }
    }
  }
);

RecordSchema.index({ databaseId: 1, userId: 1 });

export const Record = mongoose.model<IRecord>('Record', RecordSchema);
