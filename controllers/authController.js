import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { SYSTEM_GROUPS } from "../utils/conglomerates.js";
import { logError } from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_fallback_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/** Helper: generate a signed JWT */
function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * POST /api/auth/register
 * Create a new user account.
 *
 * Body: { username, email, password }
 */
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existing = await User.findOne({
            $or: [{ email }, { username }],
        });
        if (existing) {
            const field = existing.email === email ? "Email" : "Username";
            return res.status(409).json({
                success: false,
                error: `${field} sudah terdaftar`,
            });
        }

        const user = await User.create({ username, email, password });
        const token = signToken(user);

        return res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                details: messages,
            });
        }

        console.error(`[AuthController] register: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Gagal membuat akun",
        });
    }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 *
 * Body: { email, password }
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email dan password wajib diisi",
            });
        }

        // Explicitly select password since it's excluded by default
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Email atau password salah",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Email atau password salah",
            });
        }

        const token = signToken(user);

        return res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(`[AuthController] login: ${error.message}`);
        logError("Login failed", error);
        return res.status(500).json({
            success: false,
            error: `Gagal login: ${error.message}`,
        });
    }
};

/**
 * GET /api/auth/me
 * Get current user profile (requires auth middleware).
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User tidak ditemukan",
            });
        }

        // ... existing code ...
        return res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(`[AuthController] getMe: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Gagal memuat profil",
        });
    }
};

/**
 * GET /api/auth/users
 * Get all users (Admin only)
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("username email role createdAt");

        return res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error(`[AuthController] getAllUsers: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Gagal memuat data user",
        });
    }
};

/**
 * GET /api/auth/watchlist
 * Get current user's watchlist
 */
export const getWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("watchlist");
        if (!user) {
            return res.status(404).json({ success: false, error: "User tidak ditemukan" });
        }
        return res.json({
            success: true,
            watchlist: user.watchlist,
            systemGroups: SYSTEM_GROUPS,
        });
    } catch (error) {
        console.error(`[AuthController] getWatchlist: ${error.message}`);
        return res.status(500).json({ success: false, error: "Gagal memuat watchlist" });
    }
};

/**
 * POST /api/auth/watchlist
 * Add symbol to watchlist
 * Body: { symbol }
 */
export const addToWatchlist = async (req, res) => {
    try {
        const { symbol, group } = req.body;
        if (!symbol) {
            return res.status(400).json({ success: false, error: "Symbol wajib diisi" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User tidak ditemukan" });
        }

        // Check if symbol already exists
        const exists = user.watchlist.some((item) => item.symbol === symbol);
        if (exists) {
            return res.status(400).json({ success: false, error: "Saham sudah ada di watchlist" });
        }

        user.watchlist.push({
            symbol,
            group: group || "General"
        });
        await user.save();

        return res.json({
            success: true,
            watchlist: user.watchlist,
        });
    } catch (error) {
        console.error(`[AuthController] addToWatchlist: ${error.message}`);
        return res.status(500).json({ success: false, error: "Gagal menambahkan ke watchlist" });
    }
};

/**
 * DELETE /api/auth/watchlist/:symbol
 * Remove symbol from watchlist
 */
export const removeFromWatchlist = async (req, res) => {
    try {
        const { symbol } = req.params;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User tidak ditemukan" });
        }

        user.watchlist = user.watchlist.filter((item) => item.symbol !== symbol);
        await user.save();

        return res.json({
            success: true,
            watchlist: user.watchlist,
        });
    } catch (error) {
        console.error(`[AuthController] removeFromWatchlist: ${error.message}`);
        return res.status(500).json({ success: false, error: "Gagal menghapus dari watchlist" });
    }
};

/**
 * PUT /api/auth/watchlist/group
 * Rename a group
 * Body: { oldName, newName }
 */
export const renameGroup = async (req, res) => {
    try {
        const { oldName, newName } = req.body;
        if (!oldName || !newName) return res.status(400).json({ error: "Missing names" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        let updated = false;
        user.watchlist.forEach(item => {
            if (item.group === oldName) {
                item.group = newName;
                updated = true;
            }
        });

        if (updated) await user.save();

        return res.json({ success: true, watchlist: user.watchlist });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/auth/watchlist/:symbol
 * Move a stock to another group
 * Body: { group }
 */
export const updateWatchlistItem = async (req, res) => {
    try {
        const { symbol } = req.params;
        const { group } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const item = user.watchlist.find(i => i.symbol === symbol);
        if (!item) return res.status(404).json({ error: "Symbol not in watchlist" });

        item.group = group || "General";
        await user.save();

        return res.json({ success: true, watchlist: user.watchlist });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
