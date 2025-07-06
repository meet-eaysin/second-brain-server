import { Schema, model, Document } from 'mongoose';

export interface ILinkedInPost extends Document {
    userId: string;
    linkedinUserId: Schema.Types.ObjectId;
    postId: string;
    content: {
        text?: string;
        images?: string[];
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
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
}

const LinkedInPostSchema = new Schema<ILinkedInPost>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    linkedinUserId: {
        type: Schema.Types.ObjectId,
        ref: 'LinkedInUser',
        required: true
    },
    postId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    content: {
        text: String,
        images: [String],
        articles: [{
            title: String,
            url: String,
            description: String
        }]
    },
    author: {
        name: {
            type: String,
            required: true
        },
        profileUrl: String,
        profilePicture: String
    },
    engagement: {
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        reactions: {
            like: {
                type: Number,
                default: 0
            },
            celebrate: {
                type: Number,
                default: 0
            },
            support: {
                type: Number,
                default: 0
            },
            love: {
                type: Number,
                default: 0
            },
            insightful: {
                type: Number,
                default: 0
            },
            funny: {
                type: Number,
                default: 0
            }
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
        enum: ['PUBLIC', 'CONNECTIONS', 'LOGGED_IN'],
        default: 'PUBLIC'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
LinkedInPostSchema.index({ userId: 1, publishedAt: -1 });
LinkedInPostSchema.index({ postId: 1 });
LinkedInPostSchema.index({ linkedinUserId: 1 });

export const LinkedInPost = model<ILinkedInPost>('LinkedInPost', LinkedInPostSchema);
