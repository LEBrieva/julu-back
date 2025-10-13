import { Request } from 'express';
import { UserRole } from 'src/user/user.enum';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}
