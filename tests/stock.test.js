import request from "supertest";

// ── Mock yahoo-finance2 BEFORE importing app ─────────────────
jest.mock("yahoo-finance2", () => ({
    __esModule: true,
    default: {
        chart: jest.fn(),
    },
}));

// ── Mock mongoose to prevent real DB connections ─────────────
jest.mock("mongoose", () => {
    const actualMongoose = jest.requireActual("mongoose");
    return {
        ...actualMongoose,
        connect: jest.fn().mockResolvedValue({}),
        model: jest.fn().mockReturnValue({}),
    };
});

import app from "../app.js";
import yahooFinance from "yahoo-finance2";

describe("GET /api/stocks/:ticker", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const MOCK_QUOTES = [
        {
            date: new Date("2025-06-02T00:00:00.000Z"),
            open: 4100,
            high: 4150,
            low: 4050,
            close: 4120,
            volume: 50000000,
        },
        {
            date: new Date("2025-06-03T00:00:00.000Z"),
            open: 4120,
            high: 4200,
            low: 4100,
            close: 4180,
            volume: 62000000,
        },
    ];

    test("should return 200 and OHLCV data for a valid ticker", async () => {
        // Arrange — mock yahoo-finance2 chart() to return fake data
        yahooFinance.chart.mockResolvedValue({ quotes: MOCK_QUOTES });

        // Act
        const res = await request(app).get("/api/stocks/BBRI.JK");

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.ticker).toBe("BBRI.JK");
        expect(res.body.count).toBe(2);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0]).toMatchObject({
            open: 4100,
            high: 4150,
            low: 4050,
            close: 4120,
            volume: 50000000,
        });

        // Verify the mock was called correctly
        expect(yahooFinance.chart).toHaveBeenCalledTimes(1);
        expect(yahooFinance.chart).toHaveBeenCalledWith(
            "BBRI.JK",
            expect.objectContaining({ interval: "1d" })
        );
    });

    test("should return 500 when Yahoo Finance throws an error", async () => {
        // Arrange — simulate API failure
        yahooFinance.chart.mockRejectedValue(new Error("Symbol not found"));

        // Act
        const res = await request(app).get("/api/stocks/INVALIDTICKER");

        // Assert
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBeDefined();
    });

    test("should use default date range when no query params provided", async () => {
        yahooFinance.chart.mockResolvedValue({ quotes: [] });

        const res = await request(app).get("/api/stocks/BBCA.JK");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(0);
        expect(res.body.period).toBeDefined();
        expect(res.body.period.from).toBeDefined();
        expect(res.body.period.to).toBeDefined();
    });

    test("should accept custom period1 and period2 query parameters", async () => {
        yahooFinance.chart.mockResolvedValue({ quotes: MOCK_QUOTES });

        const res = await request(app).get(
            "/api/stocks/BBRI.JK?period1=2025-01-01&period2=2025-06-01"
        );

        expect(res.status).toBe(200);
        expect(res.body.period.from).toBe("2025-01-01");
        expect(res.body.period.to).toBe("2025-06-01");
    });
});

describe("GET / (Health Check)", () => {
    test("should return 200 and status ok", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});
