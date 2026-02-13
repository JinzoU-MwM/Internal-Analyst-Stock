import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_fallback_secret";

/**
 * Auth middleware — verifies the JWT from the Authorization header.
 * Attaches `req.user = { id, role }` on success.
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            console.log("[Auth] No token provided in headers");
            return res.status(401).json({
                success: false,
                error: "Akses ditolak. Token tidak ditemukan.",
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(`[Auth] Token verified for ID: ${decoded.id}`);

        // Verify the user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            console.log(`[Auth] User not found for ID: ${decoded.id}`);
            return res.status(401).json({
                success: false,
                error: "User tidak lagi tersedia.",
            });
        }

        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        console.error(`[Auth] Error: ${error.message}`);
        const message =
            error.name === "TokenExpiredError"
                ? "Token sudah kedaluwarsa."
                : "Token tidak valid.";

        return res.status(401).json({
            success: false,
            error: message,
        });
    }
};

/**
 * Role-based authorization middleware.
 * Call AFTER protect(). E.g. authorize("admin")
 *
 * @param  {...string} roles  Allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Role '${req.user.role}' tidak memiliki akses ke resource ini.`,
            });
        }
        next();
    };
};
// Shortcut for admin only
export const admin = authorize("admin");
