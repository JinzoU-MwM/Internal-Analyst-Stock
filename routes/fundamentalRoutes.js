import { Router } from "express";
import {
    createNote,
    getNotesByTicker,
    getNoteDetail,
    deleteNote,
} from "../controllers/fundamentalNoteController.js";

const router = Router();

/**
 * POST   /api/fundamental-notes          → Create a new note
 * GET    /api/fundamental-notes/detail/:id → Get full note by ID
 * DELETE /api/fundamental-notes/:id       → Delete a note
 * GET    /api/fundamental-notes/:ticker   → List notes for a ticker (lightweight)
 */
router.post("/", createNote);
router.get("/detail/:id", getNoteDetail);
router.delete("/:id", deleteNote);
router.get("/:ticker", getNotesByTicker);

export default router;
