import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export type AppRole = "super_admin" | "org_admin" | "end_user";

export type JwtPayload = {
  userId: string; // "super-admin" for the config-based super admin
  role: AppRole;
  orgId?: string; // absent for super admin
};

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
