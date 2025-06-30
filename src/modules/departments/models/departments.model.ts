import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
    organizationId: mongoose.Types.ObjectId;
    concernId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    isActive: boolean;
}

const departmentSchema = new Schema<IDepartment>({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true
    },
    concernId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'concerns',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Department = mongoose.model<IDepartment>('department', departmentSchema);

export default Department;