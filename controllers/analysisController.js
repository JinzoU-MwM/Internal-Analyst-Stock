import Analysis from "../models/Analysis.js";

/**
 * POST /api/analysis
 * Create a new stock analysis entry.
 */
export const createAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.create(req.body);

        return res.status(201).json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        // Mongoose validation errors
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                details: messages,
            });
        }

        console.error(`[AnalysisController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to create analysis",
        });
    }
};

/**
 * GET /api/analysis/:ticker
 * Retrieve all analysis history for a specific ticker, sorted newest first.
 */
export const getAnalysisByTicker = async (req, res) => {
    try {
        const { ticker } = req.params;

        const analyses = await Analysis.find({
            ticker: ticker.toUpperCase(),
        }).sort({ date: -1 });

        return res.json({
            success: true,
            ticker: ticker.toUpperCase(),
            count: analyses.length,
            data: analyses,
        });
    } catch (error) {
        console.error(`[AnalysisController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve analyses",
        });
    }
};

/**
 * DELETE /api/analysis/:id
 * Delete a technical analysis entry by ID.
 */
export const deleteAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.findByIdAndDelete(req.params.id);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: "Analysis not found",
            });
        }

        return res.json({
            success: true,
            message: "Analysis deleted successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                error: "Invalid analysis ID format",
            });
        }

        console.error(`[AnalysisController] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to delete analysis",
        });
    }
};
