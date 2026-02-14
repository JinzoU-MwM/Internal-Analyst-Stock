import { useEffect, useRef, useMemo } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";

/**
 * Compute Simple Moving Average from candle close prices.
 */
function computeSMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sum += data[j].close;
        }
        result.push({ time: data[i].time, value: sum / period });
    }
    return result;
}

/**
 * StockChart — Candlestick chart with volume bars and SMA lines.
 *
 * Powered by TradingView's lightweight-charts.
 *
 * @param {{ data: Array<{time, open, high, low, close, volume?}> }} props
 */
export default function StockChart({ data = [] }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const candleRef = useRef(null);
    const volumeRef = useRef(null);
    const sma20Ref = useRef(null);
    const sma50Ref = useRef(null);

    // Compute SMA data
    const sma20Data = useMemo(() => computeSMA(data, 20), [data]);
    const sma50Data = useMemo(() => computeSMA(data, 50), [data]);

    // ── Create chart on mount ──
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#94a3b8",
                fontFamily: "'Inter', system-ui, sans-serif",
            },
            grid: {
                vertLines: { color: "#1e223520" },
                horzLines: { color: "#1e223520" },
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
                scaleMargins: { top: 0.05, bottom: 0.25 },
            },
            timeScale: {
                borderColor: "#2a2d3e",
                timeVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
            },
            handleScroll: { vertTouchDrag: false },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinchZoom: true,
            },
        });

        // Candlestick series
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderUpColor: "#22c55e",
            borderDownColor: "#ef4444",
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });

        // Volume series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: "volume" },
            priceScaleId: "volume",
        });
        chart.priceScale("volume").applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
            visible: false,
        });

        // SMA-20 line
        const sma20Series = chart.addSeries(LineSeries, {
            color: "#f59e0b",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // SMA-50 line
        const sma50Series = chart.addSeries(LineSeries, {
            color: "#8b5cf6",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        chartRef.current = chart;
        candleRef.current = candleSeries;
        volumeRef.current = volumeSeries;
        sma20Ref.current = sma20Series;
        sma50Ref.current = sma50Series;

        // Responsive resize
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
            candleRef.current = null;
            volumeRef.current = null;
            sma20Ref.current = null;
            sma50Ref.current = null;
        };
    }, []);

    // ── Update data when prop changes ──
    useEffect(() => {
        if (!candleRef.current || !data.length) return;

        const formatted = data.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));
        candleRef.current.setData(formatted);

        // Volume bars
        if (volumeRef.current) {
            const volData = data
                .filter((d) => d.volume != null)
                .map((d) => ({
                    time: d.time,
                    value: d.volume,
                    color: d.close >= d.open ? "#22c55e30" : "#ef444430",
                }));
            volumeRef.current.setData(volData);
        }

        // SMA lines
        if (sma20Ref.current) sma20Ref.current.setData(sma20Data);
        if (sma50Ref.current) sma50Ref.current.setData(sma50Data);

        chartRef.current?.timeScale().fitContent();
    }, [data, sma20Data, sma50Data]);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden"
            />
            {/* Legend */}
            <div className="absolute top-2 left-3 flex items-center gap-4 text-[10px] font-medium pointer-events-none z-10">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-amber-400 rounded-full inline-block" />
                    <span className="text-amber-400">SMA 20</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-violet-500 rounded-full inline-block" />
                    <span className="text-violet-500">SMA 50</span>
                </span>
            </div>
        </div>
    );
}
