export type UserRole = 'admin' | 'enduser' | 'drone';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface LoginRequest {
  name: string;
  role: UserRole;
}