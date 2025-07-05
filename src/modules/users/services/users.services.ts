import {TUserDocument, UserModel} from "../models/users.model";
import {validateEmail, validatePassword, validateUsername} from "../../auth/utils/auth.utils";
import {EAuthProvider, TUser, TUserCreateRequest, TUserRole, TUserUpdateRequest} from "../types/user.types";

export const incrementTokenVersion = async (userId: string): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }).exec();
};

export const getUserWithTokenVersion = async (userId: string): Promise<(TUser & { tokenVersion: number }) | null> => {
    const user = await UserModel.findById(userId).select('+tokenVersion').lean().exec();
    return user ? {
        ...user,
        id: user._id.toString(),
        _id: undefined,
        __v: undefined
    } as TUser & { tokenVersion: number } : null;
};

export const createUser = async (userData: TUserCreateRequest): Promise<TUser> => {
    // Validation (redundant since schema validates, but good for early rejection)
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

    const newUser = await UserModel.create({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        role: userData.role || TUserRole.USER,
        authProvider: userData.authProvider || EAuthProvider.LOCAL,
        auth0Sub: userData.auth0Sub
    });

    return newUser.toJSON();
};

export const createOrUpdateAuth0User = async (auth0Profile: {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
}): Promise<TUser> => {
    let user = await UserModel.findOne({
        $or: [
            { auth0Sub: auth0Profile.sub },
            { email: auth0Profile.email.toLowerCase() }
        ]
    }).exec();

    if (!user) {
        const username = auth0Profile.name || auth0Profile.email.split('@')[0];
        user = await UserModel.create({
            email: auth0Profile.email.toLowerCase(),
            username,
            authProvider: EAuthProvider.AUTH0,
            auth0Sub: auth0Profile.sub
        });
    } else if (user.authProvider !== EAuthProvider.AUTH0) {
        user.authProvider = EAuthProvider.AUTH0;
        user.auth0Sub = auth0Profile.sub;
        user.password = undefined;
        await user.save();
    }

    return {
        ...user.toJSON(),
        id: user.id.toString(),
    };
};

export const getUserById = async (id: string): Promise<TUser | null> => {
    const user = await UserModel.findById(id).exec();
    return user ? user.toJSON() : null;
};

export const getUserByEmail = async (email: string): Promise<TUser | null> => {
    const user = await UserModel.findByEmail(email)
    return user ? user.toJSON() as TUser : null;
};

export const getUserByAuth0Sub = async (auth0Sub: string): Promise<TUser | null> => {
    const user = await UserModel.findOne({auth0Sub}).exec();
    return user ? user.toJSON() : null;
};

export const getUserByUsername = async (username: string): Promise<TUser | null> => {
    const user = await UserModel.findOne({username}).exec();
    return user ? user.toJSON() : null;
};

export const updateUser = async (id: string, updateData: TUserUpdateRequest): Promise<TUserDocument | null> => {
    const user = await UserModel.findById(id).exec();
    if (!user) return null;

    if (updateData.email && !validateEmail(updateData.email)) {
        throw new Error('Invalid email format');
    }

    if (updateData.username && !validateUsername(updateData.username)) {
        throw new Error('Invalid username format');
    }

    if (updateData.password && !validatePassword(updateData.password)) {
        throw new Error('Invalid password format');
    }

    Object.assign(user, updateData);
    if (updateData.password) {
        user.password = updateData.password; // Pre-save hook will hash it
    }

    await user.save();
    return user.toJSON();
};


export const deleteUser = async (id: string): Promise<boolean> => {
    const result = await UserModel.deleteOne({ _id: id }).exec();
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

export const getUsersWithoutPassword = (userList: TUser[]): Omit<TUser, 'password'>[] => {
    return userList.map(({ password, ...user }) => user);
};