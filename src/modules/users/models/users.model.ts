import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { EAuthProvider, TUser, TUserRole } from '../types/user.types';

export type TUserDocument = TUser &
  Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
  };

export type TUserModel = Model<TUserDocument> & {
  findByEmail(email: string): Promise<TUserDocument | null>;
  findByGoogleId(googleId: string): Promise<TUserDocument | null>;
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
      select: false,
      validate: {
        validator: function (this: TUserDocument, password: string) {
          if (this.authProvider === EAuthProvider.GOOGLE) return true;
          if (!password) return false;
          const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passwordRegex.test(password);
        },
        message:
          'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      }
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
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
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    profilePicture: {
      type: String
    },
    lastLoginAt: {
      type: Date
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
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      }
    }
  }
);

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email }).select('+password').exec();
};

UserSchema.statics.findByGoogleId = function (googleId: string) {
  return this.findOne({ googleId }).exec();
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username }).exec();
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

export const UserModel = mongoose.model<TUserDocument, TUserModel>('User', UserSchema);
