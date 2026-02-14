import express from "express";
import { protect } from "../middleware/auth.js";
import { getKonglomeratData, getKonglomeratList } from "../controllers/konglomeratController.js";

const router = express.Router();

router.use(protect); // Protect all routes

router.get("/", getKonglomeratData);
router.get("/list", getKonglomeratList);

export default router;
