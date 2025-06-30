import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
    organizationId: mongoose.Types.ObjectId;
    concernId: mongoose.Types.ObjectId;
    departmentId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    isActive: boolean;
}

const teamSchema = new Schema<ITeam>({
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

const Teams = mongoose.model<ITeam>('teams', teamSchema);

export default Teams;
