import express from "express";
import { getOwnershipData } from "../controllers/ownershipController.js";

const router = express.Router();

// Support both /api/ownership?ticker=BBCA and /api/ownership/BBCA
router.get("/", getOwnershipData);
router.get("/:ticker", getOwnershipData);

export default router;
