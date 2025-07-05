import mongoose, { Document, Schema } from 'mongoose';

export interface ILinkedInUser extends Document {
    userId: mongoose.Types.ObjectId;
    linkedinId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: Date;
    profile: {
        firstName: string;
        lastName: string;
        headline?: string;
        profilePicture?: string;
        publicProfileUrl?: string;
        emailAddress?: string;
        location?: string;
        industry?: string;
        summary?: string;
        positions?: Array<{
            title: string;
            company: string;
            startDate?: Date;
            endDate?: Date;
            description?: string;
        }>;
    };
    isActive: boolean;
    connectedAt: Date;
    lastSyncAt?: Date;
}

const linkedInUserSchema = new Schema<ILinkedInUser>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    linkedinId: {
        type: String,
        required: true,
        unique: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    tokenExpiresAt: {
        type: Date,
        required: true
    },
    profile: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        headline: String,
        profilePicture: String,
        publicProfileUrl: String,
        emailAddress: String,
        location: String,
        industry: String,
        summary: String,
        positions: [{
            title: String,
            company: String,
            startDate: Date,
            endDate: Date,
            description: String
        }]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    connectedAt: {
        type: Date,
        default: Date.now
    },
    lastSyncAt: {
        type: Date
    }
}, {
    timestamps: true
});

export const LinkedInUser = mongoose.model<ILinkedInUser>('LinkedInUser', linkedInUserSchema);
