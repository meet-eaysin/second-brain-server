import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    organizationId: mongoose.Schema.Types.ObjectId;
    concernId: mongoose.Schema.Types.ObjectId;
    departmentId: mongoose.Schema.Types.ObjectId;
    teamId: mongoose.Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Schema.Types.ObjectId;
    updatedBy: mongoose.Schema.Types.ObjectId;
}

const userSchema = new Schema<IUser>({
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
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'departments',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams',
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user', 'manager'],
        default: 'user'
    },
    password: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const User = mongoose.model<IUser>('users', userSchema);

export default User;