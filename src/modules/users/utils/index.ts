import {TUserDocument} from "../models/users.model";
import {TUser} from "../types/user.types";

export const transformUserDocument = (user: TUserDocument): TUser => {
    const userObj = user.toObject();
    return {
        id: userObj._id.toString(),
        email: userObj.email,
        username: userObj.username,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        role: userObj.role,
        authProvider: userObj.authProvider,
        googleId: userObj.googleId,
        isEmailVerified: userObj.isEmailVerified,
        isActive: userObj.isActive,
        profilePicture: userObj.profilePicture,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
        lastLoginAt: userObj.lastLoginAt,
        tokenVersion: userObj.tokenVersion,
        passwordResetToken: userObj.passwordResetToken,
        passwordResetExpires: userObj.passwordResetExpires
    };
};
