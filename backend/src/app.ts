/**
 * Express application setup.
 * Configures middleware, routes, and the error handler.
 */

import express from "express";
import cors from "cors";
import identifyRoutes from "./routes/identifyRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Health check ──
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use("/", identifyRoutes);

// ── Centralized error handler (must be last) ──
app.use(errorHandler);

export default app;
