import mongoose, {Document, Schema} from "mongoose";

// Plain data interface (for API responses and data transfer)
export interface IDatabaseRecord {
    _id: string;
    databaseId: string;

    properties: { [propertyId: string]: unknown };

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastEditedBy: string;
}

// Mongoose document interface (extends Document for database operations)
export interface IDatabaseRecordDocument extends Document {
    databaseId: string;

    properties: { [propertyId: string]: unknown };

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastEditedBy: string;
}

const DatabaseRecordSchema = new Schema<IDatabaseRecordDocument>({
    databaseId: { type: String, required: true, index: true },
    properties: { type: Map, of: Schema.Types.Mixed },

    createdBy: { type: String, required: true },
    lastEditedBy: { type: String, required: true }
}, {
    timestamps: true,
    collection: 'database_records'
});

DatabaseRecordSchema.index({ databaseId: 1, createdAt: -1 });
DatabaseRecordSchema.index({ databaseId: 1, updatedAt: -1 });

export const DatabaseRecordModel = mongoose.model<IDatabaseRecordDocument>('DatabaseRecord', DatabaseRecordSchema);
