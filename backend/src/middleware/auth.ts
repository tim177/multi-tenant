import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AppRole } from "../lib/jwt.js";

// Verifies the Bearer token and attaches req.user. Rejects if missing/invalid.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { userId: payload.userId, role: payload.role, orgId: payload.orgId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts a route to the given role(s). Use after authenticate.
export function authorize(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
