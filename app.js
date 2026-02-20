import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import stockRoutes from "./routes/stockRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import fundamentalRoutes from "./routes/fundamentalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ownershipRoutes from "./routes/ownershipRoutes.js";
import disclosureRoutes from "./routes/disclosureRoutes.js";
import brokerRoutes from "./routes/brokerRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import konglomeratRoutes from "./routes/konglomeratRoutes.js";
import msciRoutes from "./routes/msciRoutes.js";
import taRoutes from "./routes/taRoutes.js";
import { cache } from "./utils/cache.js";
import { protect, authorize } from "./middleware/auth.js";

const app = express();

const corsOptions = {
    origin: [
        "https://saham.jamnasindo.id",
        "https://internal-analyst-frontend.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
app.use(cors(corsOptions));

// Handle preflight immediately — don't let it fall through to DB middleware
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());

// ── DB Connection (lazy, for serverless compatibility) ──────
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("DB connection failed:", err.message);
        res.status(500).json({ success: false, error: "Database connection failed" });
    }
});
// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai-insight", aiRoutes);
app.use("/api/fundamental-notes", fundamentalRoutes);
app.use("/api/ownership", ownershipRoutes);
app.use("/api/disclosures", disclosureRoutes);
app.use("/api/brokers", brokerRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/konglomerat", konglomeratRoutes);
app.use("/api/msci", msciRoutes);
app.use("/api/ta", taRoutes);


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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[GlobalError] ${err.stack}`);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error",
    });
});

export default app;
