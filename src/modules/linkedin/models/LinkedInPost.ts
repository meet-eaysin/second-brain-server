import mongoose, { Document, Schema } from 'mongoose';

export interface ILinkedInPost extends Document {
    userId: mongoose.Types.ObjectId;
    linkedinUserId: mongoose.Types.ObjectId;
    postId: string;
    content: {
        text?: string;
        images?: string[];
        videos?: string[];
        articles?: Array<{
            title: string;
            url: string;
            description?: string;
        }>;
    };
    author: {
        name: string;
        profileUrl?: string;
        profilePicture?: string;
    };
    engagement: {
        likes: number;
        comments: number;
        shares: number;
        reactions: {
            like: number;
            celebrate: number;
            support: number;
            love: number;
            insightful: number;
            funny: number;
        };
    };
    publishedAt: Date;
    isUserPost: boolean;
    visibility: 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';
    lastSyncAt: Date;
}

const linkedInPostSchema = new Schema<ILinkedInPost>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    linkedinUserId: {
        type: Schema.Types.ObjectId,
        ref: 'LinkedInUser',
        required: true
    },
    postId: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        text: String,
        images: [String],
        videos: [String],
        articles: [{
            title: String,
            url: String,
            description: String
        }]
    },
    author: {
        name: { type: String, required: true },
        profileUrl: String,
        profilePicture: String
    },
    engagement: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        reactions: {
            like: { type: Number, default: 0 },
            celebrate: { type: Number, default: 0 },
            support: { type: Number, default: 0 },
            love: { type: Number, default: 0 },
            insightful: { type: Number, default: 0 },
            funny: { type: Number, default: 0 }
        }
    },
    publishedAt: {
        type: Date,
        required: true
    },
    isUserPost: {
        type: Boolean,
        default: false
    },
    visibility: {
        type: String,
        enum: ['PUBLIC', 'CONNECTIONS', 'PRIVATE'],
        default: 'PUBLIC'
    },
    lastSyncAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const LinkedInPost = mongoose.model<ILinkedInPost>('LinkedInPost', linkedInPostSchema);
