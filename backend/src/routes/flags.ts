import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Every flag route requires a valid token.
router.use(authenticate);

// GET /api/flags/check?key=... — end user checks a flag for THEIR org.
// orgId comes from the token, never from the request — this is the tenant boundary.
router.get(
  "/check",
  authorize("end_user"),
  asyncHandler(async (req, res) => {
    const key = String(req.query.key ?? "").trim();
    if (!key) return res.status(400).json({ error: "key query param is required" });

    const flag = await prisma.featureFlag.findUnique({
      where: { orgId_key: { orgId: req.user!.orgId!, key } },
    });
    res.json({ key, enabled: flag?.enabled ?? false });
  })
);

// --- Org-admin flag management (always scoped to the admin's own org) ---

// GET /api/flags — list this org's flags.
router.get(
  "/",
  authorize("org_admin"),
  asyncHandler(async (req, res) => {
    const flags = await prisma.featureFlag.findMany({
      where: { orgId: req.user!.orgId! },
      orderBy: { createdAt: "desc" },
    });
    res.json(flags);
  })
);

// POST /api/flags — create a flag in this org.
router.post(
  "/",
  authorize("org_admin"),
  asyncHandler(async (req, res) => {
    const key = String(req.body?.key ?? "").trim();
    const enabled = Boolean(req.body?.enabled);
    if (!key) return res.status(400).json({ error: "key is required" });
    try {
      const flag = await prisma.featureFlag.create({
        data: { orgId: req.user!.orgId!, key, enabled },
      });
      res.status(201).json(flag);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return res.status(409).json({ error: "feature key already exists for this organization" });
      }
      throw e;
    }
  })
);

// PATCH /api/flags/:id — enable/disable or rename (scoped to this org).
router.patch(
  "/:id",
  authorize("org_admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Ownership check: the flag must belong to the caller's org.
    const existing = await prisma.featureFlag.findFirst({
      where: { id, orgId: req.user!.orgId! },
    });
    if (!existing) return res.status(404).json({ error: "flag not found" });

    const data: { enabled?: boolean; key?: string } = {};
    if (req.body?.enabled !== undefined) data.enabled = Boolean(req.body.enabled);
    if (req.body?.key !== undefined) {
      const key = String(req.body.key).trim();
      if (!key) return res.status(400).json({ error: "key cannot be empty" });
      data.key = key;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "provide 'enabled' and/or 'key' to update" });
    }

    try {
      const flag = await prisma.featureFlag.update({ where: { id }, data });
      res.json(flag);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return res.status(409).json({ error: "feature key already exists for this organization" });
      }
      throw e;
    }
  })
);

// DELETE /api/flags/:id — remove a flag (scoped to this org).
router.delete(
  "/:id",
  authorize("org_admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.featureFlag.findFirst({
      where: { id, orgId: req.user!.orgId! },
    });
    if (!existing) return res.status(404).json({ error: "flag not found" });

    await prisma.featureFlag.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
