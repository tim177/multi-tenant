import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken, type AppRole } from "../lib/jwt.js";
import { asyncHandler } from "../lib/http.js";
import { config } from "../config.js";

const router = Router();

// Roles a user may pick when self-registering (super_admin is config-based only).
const SELF_SIGNUP_ROLES: AppRole[] = ["org_admin", "end_user"];

// POST /api/auth/super-admin/login — static credentials from env, no DB.
router.post(
  "/super-admin/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (email !== config.superAdmin.email || password !== config.superAdmin.password) {
      return res.status(401).json({ error: "Invalid super admin credentials" });
    }
    const token = signToken({ userId: "super-admin", role: "super_admin" });
    res.json({ token, user: { email, role: "super_admin" } });
  })
);

// POST /api/auth/signup — register an org_admin or end_user into an existing org.
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, orgId, role } = req.body ?? {};
    if (!email || !password || !orgId || !role) {
      return res.status(400).json({ error: "email, password, orgId and role are required" });
    }
    if (!SELF_SIGNUP_ROLES.includes(role)) {
      return res.status(400).json({ error: "role must be 'org_admin' or 'end_user'" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "password must be at least 6 characters" });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(400).json({ error: "organization not found" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "email already registered" });

    const roleRow = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRow) return res.status(500).json({ error: "role not seeded" });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        orgId,
        roleId: roleRow.id,
      },
    });

    const token = signToken({ userId: user.id, role, orgId });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role, orgId, orgName: org.name },
    });
  })
);

// POST /api/auth/login — email + password; org is derived from the user record.
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, organization: true },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const role = user.role.name as AppRole;
    const token = signToken({ userId: user.id, role, orgId: user.orgId });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role,
        orgId: user.orgId,
        orgName: user.organization.name,
      },
    });
  })
);

export default router;
