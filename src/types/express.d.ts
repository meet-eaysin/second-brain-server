import { TJwtPayload } from '../modules/users/types/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: TJwtPayload & { userId: string };
    }
  }
}

export {};
