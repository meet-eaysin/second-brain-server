import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from "bcrypt";
import {EAuthProvider, TUser, TUserRole} from "../types/user.types";

export type TUserDocument = TUser & Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
    incrementTokenVersion(): Promise<void>;
};

export type TUserModel = Model<TUserDocument> & {
    findByEmail(email: string): Promise<TUserDocument | null>;
    findByAuth0Sub(auth0Sub: string): Promise<TUserDocument | null>;
    findByUsername(username: string): Promise<TUserDocument | null>;
};

const UserSchema = new Schema<TUserDocument, TUserModel>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: (email: string) => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(email);
                },
                message: 'Invalid email format'
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            validate: {
                validator: (username: string) => {
                    const usernameRegex = /^[a-zA-Z0-9_]+$/;
                    return usernameRegex.test(username);
                },
                message: 'Username can only contain letters, numbers, and underscores'
            }
        },
        password: {
            type: String,
            select: false, // Never return password in queries
            validate: {
                validator: (password: string) => {
                    if (!password) return true; // Allow empty for OAuth users
                    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                    return passwordRegex.test(password);
                },
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
            }
        },
        role: {
            type: String,
            enum: Object.values(TUserRole),
            default: TUserRole.USER
        },
        isActive: {
            type: Boolean,
            default: true
        },
        authProvider: {
            type: String,
            enum: Object.values(EAuthProvider),
            default: EAuthProvider.LOCAL
        },
        auth0Sub: {
            type: String,
            unique: true,
            sparse: true
        },
        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
                delete ret.password;
                return ret;
            }
        },
        toObject: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
                delete ret.password;
                return ret;
            }
        }
    }
);

UserSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email }).select('+password').exec();
};

UserSchema.statics.findByAuth0Sub = function (auth0Sub: string) {
    return this.findOne({ auth0Sub }).exec();
};

UserSchema.statics.findByUsername = function (username: string) {
    return this.findOne({ username }).select('+password').exec();
};

UserSchema.pre<TUserDocument>('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error: any) {
        return next(error);
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementTokenVersion = function () {
    this.tokenVersion += 1;
    return this.save();
};

export const UserModel = mongoose.model<TUserDocument, TUserModel>('User', UserSchema);