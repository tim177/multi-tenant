import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// GET /api/organizations/public — id + name only, for signup dropdowns (no auth).
router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json(orgs);
  })
);

// POST /api/organizations — create an organization (super admin only).
router.post(
  "/",
  authenticate,
  authorize("super_admin"),
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ error: "name is required" });
    try {
      const org = await prisma.organization.create({ data: { name } });
      res.status(201).json(org);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return res.status(409).json({ error: "organization name already exists" });
      }
      throw e;
    }
  })
);

// GET /api/organizations — list all organizations (super admin only).
router.get(
  "/",
  authenticate,
  authorize("super_admin"),
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true, flags: true } } },
    });
    res.json(orgs);
  })
);

export default router;
