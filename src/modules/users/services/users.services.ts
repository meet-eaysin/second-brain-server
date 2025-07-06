import { TUser, TUserCreateRequest, TUserUpdateRequest, EAuthProvider, TUserRole } from '../types/user.types';
import {
    generateUsernameFromEmail,
    validateEmail,
    validatePassword,
    validateUsername
} from "../../auth/utils/auth.utils";
import {UserModel} from "../models/users.model";
import {TGoogleUserProfile} from "../../auth/types/auth.types";


export const createUser = async (userData: TUserCreateRequest): Promise<TUser> => {
    if (!validateEmail(userData.email)) {
        throw new Error('Invalid email format');
    }

    if (!validateUsername(userData.username)) {
        throw new Error('Username must be 3-30 characters, alphanumeric and underscore only');
    }

    if (userData.authProvider === EAuthProvider.LOCAL || !userData.authProvider) {
        if (!userData.password || !validatePassword(userData.password)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        }
    }

    const existingUser = await UserModel.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
        throw new Error('User already exists with this email or username');
    }

    const newUser = await UserModel.create({
        ...userData,
        role: userData.role || TUserRole.USER,
        authProvider: userData.authProvider || EAuthProvider.LOCAL,
        isEmailVerified: userData.isEmailVerified || false
    });

    return newUser.toJSON();
};

export const createOrUpdateGoogleUser = async (googleProfile: TGoogleUserProfile): Promise<TUser> => {
    let user = await UserModel.findOne({
        $or: [
            { googleId: googleProfile.id },
            { email: googleProfile.email }
        ]
    });

    if (user) {
        if (user.authProvider !== EAuthProvider.GOOGLE) {
            throw new Error('An account with this email already exists with a different login method');
        }

        // Update existing Google user
        user.firstName = googleProfile.given_name || user.firstName;
        user.lastName = googleProfile.family_name || user.lastName;
        user.profilePicture = googleProfile.picture || user.profilePicture;
        user.lastLoginAt = new Date();
        user.isEmailVerified = googleProfile.verified_email || user.isEmailVerified;

        await user.save();
        return user.toJSON();
    } else {
        // Create new Google user
        const username = await generateUniqueUsername(googleProfile.email);

        const newUser = await UserModel.create({
            email: googleProfile.email,
            username,
            firstName: googleProfile.given_name || '',
            lastName: googleProfile.family_name || '',
            authProvider: EAuthProvider.GOOGLE,
            googleId: googleProfile.id,
            isEmailVerified: googleProfile.verified_email || false,
            profilePicture: googleProfile.picture,
            isActive: true,
            lastLoginAt: new Date()
        });

        return newUser.toJSON();
    }
};

export const getUserById = async (id: string): Promise<TUser | null> => {
    const user = await UserModel.findById(id);
    return user ? user.toJSON() : null;
};

export const getUserByEmail = async (email: string): Promise<TUser | null> => {
    const user = await UserModel.findOne({email});
    return user ? user.toJSON() : null;
};

export const getUserByGoogleId = async (googleId: string): Promise<TUser | null> => {
    const user = await UserModel.findOne({ googleId });
    return user ? user.toJSON() : null;
};

export const getUserWithTokenVersion = async (userId: string): Promise<(TUser & { tokenVersion: number }) | null> => {
    const user = await UserModel.findById(userId).select('+tokenVersion');
    return user ? user.toJSON() as (TUser & { tokenVersion: number }) : null;
};

export const updateUser = async (id: string, updateData: TUserUpdateRequest): Promise<TUser | null> => {
    const user = await UserModel.findById(id);
    if (!user) return null;

    if (updateData.username && !validateUsername(updateData.username)) {
        throw new Error('Invalid username format');
    }

    Object.assign(user, updateData);
    await user.save();
    return user.toJSON();
};

export const deleteUser = async (id: string): Promise<boolean> => {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
};

export const getAllUsers = async (page: number = 1, limit: number = 10): Promise<{ users: TUser[]; total: number }> => {
    const [users, total] = await Promise.all([
        UserModel.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .exec(),
        UserModel.countDocuments().exec()
    ]);

    return {
        users: users.map(user => user.toJSON()),
        total
    };
};

export const incrementTokenVersion = async (userId: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
};

export const getUsersWithoutPassword = (userList: TUser[]): Omit<TUser, 'password'>[] => {
    return userList.map(({ password, ...user }) => user);
};

// Helper function to generate unique username
const generateUniqueUsername = async (email: string): Promise<string> => {
    let baseUsername = generateUsernameFromEmail(email);
    let username = baseUsername;
    let counter = 1;

    while (await UserModel.findByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
    }

    return username;
};