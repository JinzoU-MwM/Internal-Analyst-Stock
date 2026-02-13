import express from "express";
import cors from "cors";
import stockRoutes from "./routes/stockRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import fundamentalRoutes from "./routes/fundamentalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { cache } from "./utils/cache.js";
import { protect, authorize } from "./middleware/auth.js";

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai-insight", aiRoutes);
app.use("/api/fundamental-notes", fundamentalRoutes);

// ── Cache management (admin only) ───────────────────────────
app.get("/api/cache/stats", protect, authorize("admin"), (_req, res) => {
    res.json({ success: true, cache: cache.stats() });
});
app.delete("/api/cache/flush", protect, authorize("admin"), (_req, res) => {
    cache.flush();
    res.json({ success: true, message: "Cache cleared" });
});

// ── Health check ────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.json({
        status: "ok",
        message: "Internal Analyst Stock API is running",
    });
});

export default app;
