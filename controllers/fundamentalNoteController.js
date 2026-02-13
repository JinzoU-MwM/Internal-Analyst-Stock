import FundamentalNote from "../models/FundamentalNote.js";

/**
 * POST /api/fundamental-notes
 * Create a new fundamental note.
 */
export const createNote = async (req, res) => {
    try {
        const note = await FundamentalNote.create(req.body);

        return res.status(201).json({
            success: true,
            data: note,
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

        console.error(`[FundamentalNoteController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to create note",
        });
    }
};

/**
 * GET /api/fundamental-notes/:ticker
 * List all notes for a ticker (lightweight — no content field).
 */
export const getNotesByTicker = async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();

        const notes = await FundamentalNote.find({ ticker })
            .select("title analystName date valuationMethod")
            .sort({ date: -1 });

        return res.json({
            success: true,
            ticker,
            count: notes.length,
            data: notes,
        });
    } catch (error) {
        console.error(`[FundamentalNoteController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve notes",
        });
    }
};

/**
 * GET /api/fundamental-notes/detail/:id
 * Get full note content by ID.
 */
export const getNoteDetail = async (req, res) => {
    try {
        const note = await FundamentalNote.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                success: false,
                error: "Note not found",
            });
        }

        return res.json({
            success: true,
            data: note,
        });
    } catch (error) {
        // Handle invalid ObjectId format
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                error: "Invalid note ID format",
            });
        }

        console.error(`[FundamentalNoteController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve note",
        });
    }
};

/**
 * DELETE /api/fundamental-notes/:id
 * Delete a fundamental note by ID.
 */
export const deleteNote = async (req, res) => {
    try {
        const note = await FundamentalNote.findByIdAndDelete(req.params.id);

        if (!note) {
            return res.status(404).json({
                success: false,
                error: "Note not found",
            });
        }

        return res.json({
            success: true,
            message: "Note deleted successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                error: "Invalid note ID format",
            });
        }

        console.error(`[FundamentalNoteController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to delete note",
        });
    }
};
