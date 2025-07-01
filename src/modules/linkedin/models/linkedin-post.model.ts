import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
    userId: mongoose.Types.ObjectId;
    content: string;
    linkedinPostId?: string;
    likes: mongoose.Types.ObjectId[];
    comments: {
        userId: mongoose.Types.ObjectId;
        content: string;
        createdAt: Date;
    }[];
    isLinkedInPost: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 3000
    },
    linkedinPostId: String,
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 1000
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isLinkedInPost: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Post = mongoose.model<IPost>('Post', PostSchema);
