import { Schema, model, Document } from 'mongoose';

export enum ESocialPlatform {
    LINKEDIN = 'linkedin',
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    TWITTER = 'twitter',
    YOUTUBE = 'youtube',
    TIKTOK = 'tiktok'
}

export interface ISocialConnection extends Document {
    userId: string;
    platform: ESocialPlatform;
    platformUserId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt: Date;
    refreshTokenExpiresAt?: Date;
    scope: string;
    profile: Record<string, any>;
    email?: string;
    isActive: boolean;
    connectedAt: Date;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ILinkedInProfile {
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
}

export interface IFacebookProfile {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    email?: string;
    picture?: {
        data: {
            url: string;
        };
    };
    location?: {
        name: string;
    };
    hometown?: {
        name: string;
    };
    work?: Array<{
        employer: {
            name: string;
        };
        position: {
            name: string;
        };
    }>;
}

export interface IInstagramProfile {
    id: string;
    username: string;
    account_type: string;
    media_count?: number;
    followers_count?: number;
    follows_count?: number;
}

const SocialConnectionSchema = new Schema<ISocialConnection>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: Object.values(ESocialPlatform),
        required: true,
        index: true
    },
    platformUserId: {
        type: String,
        required: true,
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
        type: Schema.Types.Mixed,
        required: true
    },
    email: {
        type: String,
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

SocialConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });
SocialConnectionSchema.index({ userId: 1, isActive: 1 });
SocialConnectionSchema.index({ platform: 1, platformUserId: 1 }, { unique: true });
SocialConnectionSchema.index({ tokenExpiresAt: 1 });

// SocialConnectionSchema.set('toJSON', {
//     virtuals: true,
//     versionKey: false,
//     transform: (doc, ret) => {
//         delete ret._id;
//         delete ret.accessToken;
//         delete ret.refreshToken;
//         return ret;
//     }
// });
SocialConnectionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
        // Type-safe approach
        const finalRet = ret as Partial<ISocialConnection> & { _id?: any };
        delete finalRet._id;
        delete finalRet.accessToken;
        delete finalRet.refreshToken;
        return finalRet;
    }
});

export const SocialConnection = model<ISocialConnection>('SocialConnection', SocialConnectionSchema);
