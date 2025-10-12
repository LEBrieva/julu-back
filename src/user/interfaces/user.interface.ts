import { UserRole, UserStatus } from '../../user/user.enum';

export interface ValidatedUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  emailVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isDashboard?: boolean;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface PopulatedRefreshToken {
  _id: string;
  token: string;
  userId: ValidatedUser;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
