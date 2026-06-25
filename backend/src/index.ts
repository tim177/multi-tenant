import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler } from "./lib/http.js";
import authRoutes from "./routes/auth.js";
import organizationRoutes from "./routes/organizations.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check — also verifies the database connection.
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);

// Flag routes are mounted in Step 2.

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
