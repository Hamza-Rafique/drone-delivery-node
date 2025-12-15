import rateLimit from "express-rate-limit";

// Limit auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per window per IP
  message: "Too many login attempts, please try again later.",
});

// Limit drone heartbeat
export const heartbeatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 heartbeat calls per minute
  message: "Too many requests from this drone, slow down.",
});
