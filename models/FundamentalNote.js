import mongoose from "mongoose";

const fundamentalNoteSchema = new mongoose.Schema(
    {
        ticker: {
            type: String,
            required: [true, "Ticker symbol is required"],
            uppercase: true,
            trim: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        content: {
            type: String,
            required: [true, "Content is required"],
        },
        analystName: {
            type: String,
            required: [true, "Analyst name is required"],
            trim: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        valuationMethod: {
            type: String,
            required: [true, "Valuation method is required"],
            enum: {
                values: ["DCF", "Relative", "AssetBased"],
                message: "Valuation method must be DCF, Relative, or AssetBased",
            },
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for fast lookup by ticker + date
fundamentalNoteSchema.index({ ticker: 1, date: -1 });

const FundamentalNote = mongoose.model("FundamentalNote", fundamentalNoteSchema);

export default FundamentalNote;
