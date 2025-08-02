import { TUserDocument } from '../models/users.model';
import { TUser } from '../types/user.types';

export const transformUserDocument = (user: TUserDocument): TUser => {
  // Use toJSON() which already handles _id to id conversion
  return user.toJSON() as TUser;
};
