import { UserRole } from "src/user/user.enum";

export interface JwtUser {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isDashboard?: boolean;
}