export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  issuer: process.env.JWT_ISSUER || 'drone-delivery-api',
  audience: process.env.JWT_AUDIENCE || 'drone-delivery-users'
};

export const generateToken = (userId: string, userType: string): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      userId, 
      userType 
    },
    jwtConfig.secret,
    { 
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );
};