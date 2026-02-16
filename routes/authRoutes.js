import { Router } from "express";
import {
    register,
    login,
    getMe,
    getAllUsers,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    renameGroup,
    updateWatchlistItem,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
} from "../controllers/authController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/auth/register  → Create new user
 * POST /api/auth/login     → Authenticate & get JWT
 * GET  /api/auth/me        → Get current user profile (protected)
 */
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.get("/users", protect, admin, getAllUsers);

// Profile routes
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Watchlist routes
router.get("/watchlist", protect, getWatchlist);
router.post("/watchlist", protect, addToWatchlist);
router.put("/watchlist/group", protect, renameGroup);
router.put("/watchlist/:symbol", protect, updateWatchlistItem);
router.delete("/watchlist/:symbol", protect, removeFromWatchlist);

export default router;
