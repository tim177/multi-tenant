import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";

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

// Super-admin-protected create/list endpoints are added in Step 2.

export default router;
