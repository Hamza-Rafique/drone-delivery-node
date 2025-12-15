export type UserRole = 'ADMIN' | 'ENDUSER' | 'DRONE';

export interface JwtPayload {
  id: any;
  userId: string;
  role: UserRole;
  name: string;
}
