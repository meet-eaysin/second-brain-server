import mongoose, { Document, Schema } from 'mongoose';

export interface IConcern extends Document {
    organizationId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    email: string;
    website: string;
    logo: string;
    industry: string;
    founded: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    isActive: boolean;
    adminId: mongoose.Types.ObjectId;
}

const concernSchema = new Schema<IConcern>({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
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
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    zipCode: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    website: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        required: true,
        trim: true
    },
    industry: {
        type: String,
        required: true,
        trim: true
    },
    founded: {
        type: Date
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
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },

}, { timestamps: true });

concernSchema.index({ name: 1 });
concernSchema.index({ industry: 1 });
concernSchema.index({ organizationId: 1 });

const Concerns = mongoose.model<IConcern>('concerns', concernSchema);

export default Concerns;
