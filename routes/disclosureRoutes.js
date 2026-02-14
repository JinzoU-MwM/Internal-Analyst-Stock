import express from "express";
import { getDisclosures } from "../controllers/disclosureController.js";

const router = express.Router();

// GET /api/disclosures/:category  (others | dividends | rups)
router.get("/:category", getDisclosures);

export default router;
