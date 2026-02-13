import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        ticker: {
            type: String,
            required: [true, "Ticker symbol is required"],
            uppercase: true,
            trim: true,
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
        action: {
            type: String,
            enum: {
                values: ["BUY", "SELL", "WAIT", "HOLD"],
                message: "{VALUE} is not a valid action",
            },
            required: [true, "Action is required"],
        },
        timeframe: {
            type: String,
            enum: {
                values: ["SCALPING", "SWING", "INVEST"],
                message: "{VALUE} is not a valid timeframe",
            },
            required: [true, "Timeframe is required"],
        },
        entryPrice: {
            type: Number,
            min: [0, "Entry price cannot be negative"],
        },
        targetPrice: {
            type: Number,
            min: [0, "Target price cannot be negative"],
        },
        stopLoss: {
            type: Number,
            min: [0, "Stop loss cannot be negative"],
        },
        notes: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast lookups by ticker
analysisSchema.index({ ticker: 1, date: -1 });

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
