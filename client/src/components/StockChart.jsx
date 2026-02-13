import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";

/**
 * StockChart — Candlestick chart powered by TradingView's lightweight-charts.
 *
 * Responsive sizing:
 *   • Mobile:  300px tall
 *   • Desktop: 500px tall
 *
 * Uses ResizeObserver for dynamic resize on rotation / window changes.
 * Pinch-to-zoom + mouse wheel zoom enabled for mobile-friendly interaction.
 *
 * @param {{ data: Array<{time: string, open: number, high: number, low: number, close: number}> }} props
 */
export default function StockChart({ data = [] }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    // ── Create chart on mount ──────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#94a3b8",
                fontFamily: "'Inter', system-ui, sans-serif",
            },
            grid: {
                vertLines: { color: "#1e2235" },
                horzLines: { color: "#1e2235" },
            },
            crosshair: {
                mode: 0,
                vertLine: {
                    color: "#6366f1",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#6366f1",
                },
                horzLine: {
                    color: "#6366f1",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#6366f1",
                },
            },
            rightPriceScale: {
                borderColor: "#2a2d3e",
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: "#2a2d3e",
                timeVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
            },

            // ── Touch / scroll interaction ─────────────────────
            handleScroll: {
                vertTouchDrag: false, // prevent accidental vertical scroll
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinchZoom: true, // mobile pinch-to-zoom
            },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderUpColor: "#22c55e",
            borderDownColor: "#ef4444",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });

        chartRef.current = chart;
        seriesRef.current = candleSeries;

        // ── Responsive resize via ResizeObserver ───────────────
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    chart.applyOptions({ width, height });
                }
            }
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, []);

    // ── Update data when prop changes ──────────────────────────
    useEffect(() => {
        if (!seriesRef.current || !data.length) return;

        const formatted = data.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        seriesRef.current.setData(formatted);
        chartRef.current?.timeScale().fitContent();
    }, [data]);

    return (
        <div
            ref={containerRef}
            className="w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden"
        />
    );
}
