import { Schema, model, Document } from 'mongoose';

export interface ILinkedInUser extends Document {
    userId: string;
    linkedinId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: Date;
    refreshTokenExpiresAt?: Date;
    scope: string;
    profile: {
        sub: string;
        name: string;
        given_name: string;
        family_name: string;
        email: string;
        email_verified: boolean;
        picture?: string;
        locale?: {
            language: string;
            country: string;
        };
        headline?: string;
        publicProfileUrl?: string;
        industry?: string;
        location?: string;
        summary?: string;
    };
    email: string;
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
        select: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    tokenExpiresAt: {
        type: Date,
        required: true
    },
    refreshTokenExpiresAt: {
        type: Date
    },
    scope: {
        type: String,
        required: true
    },
    profile: {
        sub: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        given_name: {
            type: String,
            required: true
        },
        family_name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        email_verified: {
            type: Boolean,
            required: true
        },
        picture: String,
        locale: {
            language: String,
            country: String
        },
        headline: String,
        publicProfileUrl: String,
        industry: String,
        location: String,
        summary: String
    },
    email: {
        type: String,
        required: true,
        index: true
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

LinkedInUserSchema.index({ userId: 1, isActive: 1 });
LinkedInUserSchema.index({ tokenExpiresAt: 1 });
LinkedInUserSchema.index({ email: 1 });
LinkedInUserSchema.index({ 'profile.sub': 1 });

LinkedInUserSchema.virtual('profile.firstName').get(function() {
    return this.profile.given_name;
});

LinkedInUserSchema.virtual('profile.lastName').get(function() {
    return this.profile.family_name;
});

LinkedInUserSchema.virtual('profile.profilePicture').get(function() {
    return this.profile.picture;
});

LinkedInUserSchema.virtual('profile.emailAddress').get(function() {
    return this.profile.email;
});

LinkedInUserSchema.set('toJSON', { virtuals: true });
LinkedInUserSchema.set('toObject', { virtuals: true });

export const LinkedInUser = model<ILinkedInUser>('LinkedInUser', LinkedInUserSchema);