export type UserRole = 'ADMIN' | 'ENDUSER' | 'DRONE';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  name: string;
}
