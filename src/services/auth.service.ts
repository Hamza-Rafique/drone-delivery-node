import jwt, { Secret, SignOptions } from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { jwtConfig } from "../config/jwt";
import { UserRole, JwtPayload } from "../types";

export class AuthService {
  async login(
    name: string,
    role: UserRole
  ): Promise<{ token: string; user: IUser }> {
    let user = await User.findOne({ name, role });

    if (!user) {
      user = new User({ name, role });
      await user.save();
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
    };

    const signOptions: SignOptions = {
      expiresIn: jwtConfig.expiresIn,
    };

    const token = jwt.sign(payload, jwtConfig.secret as Secret, signOptions);

    return { token, user };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, jwtConfig.secret as Secret) as JwtPayload;
    } catch {
      return null;
    }
  }

  async validateUser(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }
}
