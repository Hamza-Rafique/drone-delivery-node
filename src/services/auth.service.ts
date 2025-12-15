import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { jwtConfig } from '../config/jwt';
import { UserRole, JwtPayload } from '../types/jwt';

export class AuthService {
  async login(name: string, role: UserRole) {
    let user = await User.findOne({ name, role });

    if (!user) {
      user = await User.create({ name, role });
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
    };

    const signOptions: SignOptions = {
      expiresIn: jwtConfig.expiresIn as any,
    };
    const token = jwt.sign(payload, jwtConfig.secret as string, signOptions);

    return { token, user };
  }
}
