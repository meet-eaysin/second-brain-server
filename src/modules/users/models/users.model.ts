import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    auth0Id: string;
    email: string;
    name: string;
    picture?: string;
    linkedinProfile?: {
        id: string;
        accessToken: string;
        refreshToken?: string;
        expiresAt: Date;
        profile: {
            firstName: string;
            lastName: string;
            profilePicture?: string;
            headline?: string;
            industry?: string;
            location?: string;
        };
    };
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date;
}

const UserSchema: Schema = new Schema({
    auth0Id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true
    },
    picture: String,
    linkedinProfile: {
        id: String,
        accessToken: String,
        refreshToken: String,
        expiresAt: Date,
        profile: {
            firstName: String,
            lastName: String,
            profilePicture: String,
            headline: String,
            industry: String,
            location: String
        }
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);
