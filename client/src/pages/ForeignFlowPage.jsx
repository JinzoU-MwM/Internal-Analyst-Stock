
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Calendar, TrendingUp, BarChart2 } from "lucide-react";
import ForeignFlowDaily from "./ForeignFlowDaily";
import ForeignFlowTrends from "./ForeignFlowTrends";

const TABS = [
    { key: "daily", label: "Daily Flow", icon: <Calendar className="w-4 h-4" /> },
    { key: "trends", label: "Flow Trends", icon: <TrendingUp className="w-4 h-4" /> },
];

export default function ForeignFlowPage() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState("daily");

    // Daily State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState(null);
    const [loadingDaily, setLoadingDaily] = useState(false);

    // Trends State
    const [trendType, setTrendType] = useState("accumulation");
    const [lookback, setLookback] = useState(7);
    const [trendsData, setTrendsData] = useState(null);
    const [loadingTrends, setLoadingTrends] = useState(false);

    useEffect(() => {
        if (activeTab === "daily" && !dailyData) fetchDaily();
        if (activeTab === "trends" && !trendsData) fetchTrends();
    }, [activeTab]); // Initial load when tab switches

    // Fetch on filter change
    useEffect(() => {
        if (activeTab === "daily") fetchDaily();
    }, [date]);

    useEffect(() => {
        if (activeTab === "trends") fetchTrends();
    }, [trendType, lookback]);


    const fetchDaily = async () => {
        setLoadingDaily(true);
        try {
            const res = await fetch(`/api/market/foreign-flow?date=${date}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setDailyData(json.data);
            else {
                setDailyData(null);
                toast.error(json.error || "Gagal memuat daily flow");
            }
        } catch (e) {
            toast.error("Error connection");
        } finally {
            setLoadingDaily(false);
        }
    };

    const fetchTrends = async () => {
        setLoadingTrends(true);
        try {
            const res = await fetch(`/api/market/foreign-flow-trends?type=${trendType}&lookback_days=${lookback}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setTrendsData(json.data);
            else {
                setTrendsData(null);
                toast.error(json.error || "Gagal memuat trends");
            }
        } catch (e) {
            toast.error("Error connection");
        } finally {
            setLoadingTrends(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-text-primary pb-20">
            {/* Header */}
            <div className="border-b border-border/50 bg-surface-card/50 backdrop-blur-sm sticky top-0 md:top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 pt-5 pb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                            <BarChart2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text-primary">Foreign Flow</h1>
                            <p className="text-xs text-text-muted">Analisis aliran dana asing</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto -mb-px">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${activeTab === tab.key
                                        ? "text-accent border-accent"
                                        : "text-text-muted border-transparent hover:text-text-primary hover:border-border"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {activeTab === "daily" && (
                    <ForeignFlowDaily
                        date={date}
                        setDate={setDate}
                        data={dailyData}
                        loading={loadingDaily}
                        onRefresh={fetchDaily}
                    />
                )}
                {activeTab === "trends" && (
                    <ForeignFlowTrends
                        type={trendType}
                        setType={setTrendType}
                        lookback={lookback}
                        setLookback={setLookback}
                        data={trendsData}
                        loading={loadingTrends}
                        onRefresh={fetchTrends}
                    />
                )}
            </main>
        </div>
    );
}
