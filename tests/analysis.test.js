import request from "supertest";

// ── Mock yahoo-finance2 (required by app imports) ────────────
jest.mock("yahoo-finance2", () => ({
    __esModule: true,
    default: { chart: jest.fn() },
}));

// ── Mock the Analysis model ──────────────────────────────────
jest.mock("../models/Analysis.js", () => {
    const mockModel = {
        create: jest.fn(),
        find: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import app from "../app.js";
import Analysis from "../models/Analysis.js";

describe("POST /api/analysis", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const VALID_BODY = {
        ticker: "BBRI.JK",
        analystName: "Andi",
        action: "BUY",
        timeframe: "SWING",
        entryPrice: 4100,
        targetPrice: 4500,
        stopLoss: 3900,
        notes: "Bullish divergence on RSI",
    };

    test("should return 201 when creating a valid analysis", async () => {
        // Arrange — mock Analysis.create to return the saved document
        const savedDoc = {
            _id: "abc123",
            ...VALID_BODY,
            ticker: "BBRI.JK",
            date: new Date().toISOString(),
            isActive: true,
        };
        Analysis.create.mockResolvedValue(savedDoc);

        // Act
        const res = await request(app)
            .post("/api/analysis")
            .send(VALID_BODY);

        // Assert
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ticker).toBe("BBRI.JK");
        expect(res.body.data.analystName).toBe("Andi");
        expect(Analysis.create).toHaveBeenCalledTimes(1);
        expect(Analysis.create).toHaveBeenCalledWith(VALID_BODY);
    });

    test("should return 400 when required fields are missing", async () => {
        // Arrange — simulate a Mongoose ValidationError
        const validationError = new Error("Validation failed");
        validationError.name = "ValidationError";
        validationError.errors = {
            ticker: { message: "Ticker symbol is required" },
            action: { message: "Action is required" },
        };
        Analysis.create.mockRejectedValue(validationError);

        // Act
        const res = await request(app)
            .post("/api/analysis")
            .send({ notes: "missing everything" });

        // Assert
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe("Validation failed");
        expect(res.body.details).toEqual(
            expect.arrayContaining([
                "Ticker symbol is required",
                "Action is required",
            ])
        );
    });

    test("should return 500 on unexpected server error", async () => {
        Analysis.create.mockRejectedValue(new Error("DB connection lost"));

        const res = await request(app)
            .post("/api/analysis")
            .send(VALID_BODY);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe("Failed to create analysis");
    });
});

describe("GET /api/analysis/:ticker", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return 200 and analyses for a valid ticker", async () => {
        // Arrange — mock the chained .find().sort() call
        const mockAnalyses = [
            {
                _id: "a1",
                ticker: "BBRI.JK",
                analystName: "Andi",
                action: "BUY",
                timeframe: "SWING",
                date: "2025-06-01",
            },
            {
                _id: "a2",
                ticker: "BBRI.JK",
                analystName: "Budi",
                action: "HOLD",
                timeframe: "INVEST",
                date: "2025-05-15",
            },
        ];
        Analysis.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockAnalyses),
        });

        // Act
        const res = await request(app).get("/api/analysis/BBRI.JK");

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.ticker).toBe("BBRI.JK");
        expect(res.body.count).toBe(2);
        expect(res.body.data).toHaveLength(2);
        expect(Analysis.find).toHaveBeenCalledWith({ ticker: "BBRI.JK" });
    });

    test("should return empty array when no analyses exist", async () => {
        Analysis.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
        });

        const res = await request(app).get("/api/analysis/NEWSTOCK.JK");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(0);
        expect(res.body.data).toHaveLength(0);
    });

    test("should return 500 on database error", async () => {
        Analysis.find.mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error("DB error")),
        });

        const res = await request(app).get("/api/analysis/BBRI.JK");

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe("Failed to retrieve analyses");
    });
});
