import { useState } from "react";
import BrokerAnalysisPage from "./BrokerAnalysisPage";
import BroksumPage from "./BroksumPage";
import BrokerIntelPage from "./BrokerIntelPage";
import SmartMoneyPage from "./SmartMoneyPage";

const TABS = [
    {
        key: "flow",
        label: "Flow Broker",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
    },
    {
        key: "broksum",
        label: "Broksum",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        key: "intel",
        label: "Broker Intel",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    },
    {
        key: "smartmoney",
        label: "Smart Money",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
        ),
    },
];

export default function BrokerPage() {
    const [activeTab, setActiveTab] = useState("flow");

    return (
        <div>
            {/* Page Header */}
            <div className="border-b border-border/50 bg-surface-card/50 backdrop-blur-sm sticky top-0 lg:top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 pt-5 pb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text-primary">Broker Analysis</h1>
                            <p className="text-xs text-text-muted">Analisis aliran dana & aktivitas broker</p>
                        </div>
                    </div>

                    {/* Tab Bar */}
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

            {/* Tab Content */}
            <div>
                {activeTab === "flow" && <BrokerAnalysisPage />}
                {activeTab === "broksum" && <BroksumPage />}
                {activeTab === "intel" && <BrokerIntelPage />}
                {activeTab === "smartmoney" && <SmartMoneyPage />}
            </div>
        </div>
    );
}
