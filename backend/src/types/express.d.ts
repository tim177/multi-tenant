import "express";
import type { AppRole } from "../lib/jwt.js";

// Attach the authenticated principal to the Express request.
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: AppRole;
        orgId?: string; // absent for super admin
      };
    }
  }
}
