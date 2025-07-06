import { Schema, model, Document } from 'mongoose';

export interface ILinkedInUser extends Document {
    userId: string;
    linkedinId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: Date;
    refreshTokenExpiresAt?: Date;
    profile: {
        firstName: string;
        lastName: string;
        headline?: string;
        profilePicture?: string;
        publicProfileUrl?: string;
        emailAddress?: string;
    };
    isActive: boolean;
    connectedAt: Date;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LinkedInUserSchema = new Schema<ILinkedInUser>({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    linkedinId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    accessToken: {
        type: String,
        required: true,
        select: false // Don't include by default for security
    },
    refreshToken: {
        type: String,
        select: false // Don't include by default for security
    },
    tokenExpiresAt: {
        type: Date,
        required: true
    },
    refreshTokenExpiresAt: {
        type: Date
    },
    profile: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        headline: String,
        profilePicture: String,
        publicProfileUrl: String,
        emailAddress: String
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    connectedAt: {
        type: Date,
        default: Date.now
    },
    lastSyncAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
LinkedInUserSchema.index({ userId: 1, isActive: 1 });
LinkedInUserSchema.index({ tokenExpiresAt: 1 });

export const LinkedInUser = model<ILinkedInUser>('LinkedInUser', LinkedInUserSchema);
