import { useEffect, useRef, useMemo, useState } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
    BollingerBandsSeries,
    AreaSeries,
} from "lightweight-charts";

/**
 * TAChart — Advanced Technical Analysis Chart
 *
 * Features:
 * - Candlestick with volume
 * - Multiple indicator overlays (SMA, EMA, BB)
 * - Separate RSI and MACD panels
 *
 * @param {Object} props
 * @param {Array} props.data - OHLCV data
 * @param {Object} props.indicators - Indicator data from Python backend
 * @param {Object} props.visibleIndicators - Which indicators to show
 */
export default function TAChart({
    data = [],
    indicators = {},
    visibleIndicators = {},
    height = 500,
}) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);

    // Indicator series refs
    const sma20Ref = useRef(null);
    const sma50Ref = useRef(null);
    const sma200Ref = useRef(null);
    const ema12Ref = useRef(null);
    const ema26Ref = useRef(null);
    const bbRef = useRef(null);

    // Separate charts for RSI and MACD
    const rsiContainerRef = useRef(null);
    const rsiChartRef = useRef(null);
    const rsiSeriesRef = useRef(null);
    const rsi30Ref = useRef(null);
    const rsi70Ref = useRef(null);

    const macdContainerRef = useRef(null);
    const macdChartRef = useRef(null);
    const macdSeriesRef = useRef(null);
    const macdSignalRef = useRef(null);
    const macdHistRef = useRef(null);

    const [chartReady, setChartReady] = useState(false);

    // ── Create main chart on mount ─────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#64748b",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: "#1e293b20" },
                horzLines: { color: "#1e293b20" },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: "#6366f180",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#6366f1",
                },
                horzLine: {
                    color: "#6366f180",
                    width: 1,
                    style: 2,
                    labelBackgroundColor: "#6366f1",
                },
            },
            rightPriceScale: {
                borderColor: "#1e293b",
                scaleMargins: { top: 0.05, bottom: 0.2 },
            },
            timeScale: {
                borderColor: "#1e293b",
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
            scaleMargins: { top: 0.85, bottom: 0 },
            visible: false,
        });

        // SMA-20
        const sma20 = chart.addSeries(LineSeries, {
            color: "#f59e0b",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // SMA-50
        const sma50 = chart.addSeries(LineSeries, {
            color: "#8b5cf6",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // SMA-200
        const sma200 = chart.addSeries(LineSeries, {
            color: "#06b6d4",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // EMA-12
        const ema12 = chart.addSeries(LineSeries, {
            color: "#ec4899",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // EMA-26
        const ema26 = chart.addSeries(LineSeries, {
            color: "#14b8a6",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // Bollinger Bands
        const bb = chart.addSeries(BollingerBandsSeries, {
            upperLineColor: "#3b82f680",
            lowerLineColor: "#3b82f680",
            middleLineColor: "#3b82f640",
            lineWidth: 1,
            areaFillColor: "#3b82f610",
            priceLineVisible: false,
            lastValueVisible: false,
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;
        sma20Ref.current = sma20;
        sma50Ref.current = sma50;
        sma200Ref.current = sma200;
        ema12Ref.current = ema12;
        ema26Ref.current = ema26;
        bbRef.current = bb;

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
        };
    }, []);

    // ── Create RSI chart ───────────────────────────────────────────────
    useEffect(() => {
        if (!rsiContainerRef.current || !visibleIndicators.rsi) return;

        const rsiChart = createChart(rsiContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#64748b",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 10,
            },
            grid: {
                vertLines: { color: "#1e293b10" },
                horzLines: { color: "#1e293b20" },
            },
            rightPriceScale: {
                borderColor: "#1e293b",
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: "#1e293b",
                visible: false,
            },
            handleScale: false,
            handleScroll: false,
        });

        // RSI line
        const rsiLine = rsiChart.addSeries(LineSeries, {
            color: "#a855f7",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: true,
        });

        // Overbought line (70)
        const rsi70 = rsiChart.addSeries(LineSeries, {
            color: "#ef444480",
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        // Oversold line (30)
        const rsi30 = rsiChart.addSeries(LineSeries, {
            color: "#22c55e80",
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
        });

        rsiChartRef.current = rsiChart;
        rsiSeriesRef.current = rsiLine;
        rsi70Ref.current = rsi70;
        rsi30Ref.current = rsi30;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                if (width > 0) {
                    rsiChart.applyOptions({ width, height: 100 });
                }
            }
        });
        resizeObserver.observe(rsiContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            rsiChart.remove();
            rsiChartRef.current = null;
        };
    }, [visibleIndicators.rsi]);

    // ── Create MACD chart ──────────────────────────────────────────────
    useEffect(() => {
        if (!macdContainerRef.current || !visibleIndicators.macd) return;

        const macdChart = createChart(macdContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#64748b",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                fontSize: 10,
            },
            grid: {
                vertLines: { color: "#1e293b10" },
                horzLines: { color: "#1e293b20" },
            },
            rightPriceScale: {
                borderColor: "#1e293b",
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: "#1e293b",
                visible: false,
            },
            handleScale: false,
            handleScroll: false,
        });

        // MACD histogram
        const macdHist = macdChart.addSeries(HistogramSeries, {
            priceFormat: { type: "price", precision: 4 },
            priceScaleId: "macd",
        });

        // MACD line
        const macdLine = macdChart.addSeries(LineSeries, {
            color: "#3b82f6",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
        });

        // Signal line
        const signalLine = macdChart.addSeries(LineSeries, {
            color: "#f97316",
            lineWidth: 1.5,
            priceLineVisible: false,
            lastValueVisible: false,
        });

        macdChartRef.current = macdChart;
        macdSeriesRef.current = macdLine;
        macdSignalRef.current = signalLine;
        macdHistRef.current = macdHist;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                if (width > 0) {
                    macdChart.applyOptions({ width, height: 100 });
                }
            }
        });
        resizeObserver.observe(macdContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            macdChart.remove();
            macdChartRef.current = null;
        };
    }, [visibleIndicators.macd]);

    // ── Update main chart data ─────────────────────────────────────────
    useEffect(() => {
        if (!candleSeriesRef.current || !data.length) return;

        // Candlesticks
        candleSeriesRef.current.setData(
            data.map((d) => ({
                time: d.time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }))
        );

        // Volume
        if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData(
                data
                    .filter((d) => d.volume != null)
                    .map((d) => ({
                        time: d.time,
                        value: d.volume,
                        color: d.close >= d.open ? "#22c55e20" : "#ef444420",
                    }))
            );
        }

        chartRef.current?.timeScale().fitContent();
    }, [data]);

    // ── Update indicator overlays ──────────────────────────────────────
    useEffect(() => {
        if (!indicators.sma || !data.length) return;

        // SMA
        if (visibleIndicators.sma20 && sma20Ref.current) {
            const sma20Data = indicators.sma
                .filter((d) => d.sma_20 != null)
                .map((d) => ({ time: d.time, value: d.sma_20 }));
            sma20Ref.current.setData(sma20Data);
        } else if (sma20Ref.current) {
            sma20Ref.current.setData([]);
        }

        if (visibleIndicators.sma50 && sma50Ref.current) {
            const sma50Data = indicators.sma
                .filter((d) => d.sma_50 != null)
                .map((d) => ({ time: d.time, value: d.sma_50 }));
            sma50Ref.current.setData(sma50Data);
        } else if (sma50Ref.current) {
            sma50Ref.current.setData([]);
        }

        if (visibleIndicators.sma200 && sma200Ref.current) {
            const sma200Data = indicators.sma
                .filter((d) => d.sma_200 != null)
                .map((d) => ({ time: d.time, value: d.sma_200 }));
            sma200Ref.current.setData(sma200Data);
        } else if (sma200Ref.current) {
            sma200Ref.current.setData([]);
        }

        // EMA
        if (visibleIndicators.ema && ema12Ref.current && indicators.ema) {
            const ema12Data = indicators.ema
                .filter((d) => d.ema_12 != null)
                .map((d) => ({ time: d.time, value: d.ema_12 }));
            ema12Ref.current.setData(ema12Data);
        } else if (ema12Ref.current) {
            ema12Ref.current.setData([]);
        }

        if (visibleIndicators.ema && ema26Ref.current && indicators.ema) {
            const ema26Data = indicators.ema
                .filter((d) => d.ema_26 != null)
                .map((d) => ({ time: d.time, value: d.ema_26 }));
            ema26Ref.current.setData(ema26Data);
        } else if (ema26Ref.current) {
            ema26Ref.current.setData([]);
        }

        // Bollinger Bands
        if (visibleIndicators.bb && bbRef.current && indicators.bb) {
            const bbData = indicators.bb
                .filter((d) => d.upper != null && d.lower != null)
                .map((d) => ({
                    time: d.time,
                    upper: d.upper,
                    middle: d.middle,
                    lower: d.lower,
                }));
            bbRef.current.setData(bbData);
        } else if (bbRef.current) {
            bbRef.current.setData([]);
        }
    }, [indicators, visibleIndicators, data]);

    // ── Update RSI chart ───────────────────────────────────────────────
    useEffect(() => {
        if (!rsiSeriesRef.current || !indicators.rsi || !visibleIndicators.rsi) return;

        const rsiData = indicators.rsi
            .filter((d) => d.value != null)
            .map((d) => ({ time: d.time, value: d.value }));
        rsiSeriesRef.current.setData(rsiData);

        // Static lines at 30 and 70
        if (rsi30Ref.current && rsiData.length > 0) {
            const line30Data = rsiData.map((d) => ({ time: d.time, value: 30 }));
            rsi30Ref.current.setData(line30Data);
        }
        if (rsi70Ref.current && rsiData.length > 0) {
            const line70Data = rsiData.map((d) => ({ time: d.time, value: 70 }));
            rsi70Ref.current.setData(line70Data);
        }

        rsiChartRef.current?.timeScale().fitContent();
    }, [indicators.rsi, visibleIndicators.rsi]);

    // ── Update MACD chart ──────────────────────────────────────────────
    useEffect(() => {
        if (!macdSeriesRef.current || !indicators.macd || !visibleIndicators.macd) return;

        const macdData = indicators.macd.filter((d) => d.macd != null);

        if (macdSeriesRef.current) {
            macdSeriesRef.current.setData(
                macdData.map((d) => ({ time: d.time, value: d.macd }))
            );
        }
        if (macdSignalRef.current) {
            macdSignalRef.current.setData(
                macdData.map((d) => ({ time: d.time, value: d.signal }))
            );
        }
        if (macdHistRef.current) {
            macdHistRef.current.setData(
                macdData.map((d) => ({
                    time: d.time,
                    value: d.histogram,
                    color: d.histogram >= 0 ? "#22c55e60" : "#ef444460",
                }))
            );
        }

        macdChartRef.current?.timeScale().fitContent();
    }, [indicators.macd, visibleIndicators.macd]);

    // ── Sync all chart time scales ─────────────────────────────────────
    useEffect(() => {
        if (!chartRef.current) return;

        const mainTimeScale = chartRef.current.timeScale();

        const syncCharts = () => {
            const range = mainTimeScale.getVisibleRange();
            if (range) {
                rsiChartRef.current?.timeScale().setVisibleRange(range);
                macdChartRef.current?.timeScale().setVisibleRange(range);
            }
        };

        mainTimeScale.subscribeVisibleTimeRangeChange(syncCharts);

        return () => {
            mainTimeScale.unsubscribeVisibleTimeRangeChange(syncCharts);
        };
    }, [visibleIndicators.rsi, visibleIndicators.macd]);

    return (
        <div className="space-y-2">
            {/* Main Chart */}
            <div className="relative bg-surface-card border border-border rounded-xl overflow-hidden">
                <div
                    ref={containerRef}
                    className="w-full"
                    style={{ height: `${height}px` }}
                />

                {/* Legend */}
                <div className="absolute top-3 left-4 flex flex-wrap items-center gap-3 text-[10px] font-medium pointer-events-none z-10">
                    {visibleIndicators.sma20 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
                            <span className="text-amber-400">SMA 20</span>
                        </span>
                    )}
                    {visibleIndicators.sma50 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-violet-500 rounded-full" />
                            <span className="text-violet-500">SMA 50</span>
                        </span>
                    )}
                    {visibleIndicators.sma200 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-cyan-500 rounded-full" />
                            <span className="text-cyan-500">SMA 200</span>
                        </span>
                    )}
                    {visibleIndicators.ema && (
                        <>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-0.5 bg-pink-500 rounded-full" />
                                <span className="text-pink-500">EMA 12</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-0.5 bg-teal-500 rounded-full" />
                                <span className="text-teal-500">EMA 26</span>
                            </span>
                        </>
                    )}
                    {visibleIndicators.bb && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-2 bg-blue-500/30 border border-blue-500/50 rounded-sm" />
                            <span className="text-blue-400">BB (20,2)</span>
                        </span>
                    )}
                </div>
            </div>

            {/* RSI Chart */}
            {visibleIndicators.rsi && (
                <div className="relative bg-surface-card border border-border rounded-xl overflow-hidden">
                    <div ref={rsiContainerRef} className="w-full h-[100px]" />
                    <div className="absolute top-2 left-4 text-[10px] font-medium text-purple-400">
                        RSI (14)
                    </div>
                </div>
            )}

            {/* MACD Chart */}
            {visibleIndicators.macd && (
                <div className="relative bg-surface-card border border-border rounded-xl overflow-hidden">
                    <div ref={macdContainerRef} className="w-full h-[100px]" />
                    <div className="absolute top-2 left-4 flex items-center gap-3 text-[10px] font-medium">
                        <span className="text-blue-400">MACD (12,26,9)</span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-blue-500 rounded" />
                            <span className="text-blue-400">MACD</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-orange-500 rounded" />
                            <span className="text-orange-400">Signal</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
