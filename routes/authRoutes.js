import { Router } from "express";
import { register, login, getMe, getAllUsers } from "../controllers/authController.js";
import { protect, admin } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/auth/register  → Create new user
 * POST /api/auth/login     → Authenticate & get JWT
 * GET  /api/auth/me        → Get current user profile (protected)
 */
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/users", protect, admin, getAllUsers);

export default router;
