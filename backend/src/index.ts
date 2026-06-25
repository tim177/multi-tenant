import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check — also verifies the database connection.
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

// Routes (auth, organizations, flags) are mounted in later steps.

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
