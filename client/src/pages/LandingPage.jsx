import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
    const { isAuthenticated } = useAuth();

    const features = [
        {
            icon: "📊",
            title: "Analisis Teknikal Lengkap",
            description: "Chart interaktif dengan 20+ indikator teknikal: SMA, EMA, RSI, MACD, Bollinger Bands, dan deteksi sinyal otomatis.",
            gradient: "from-blue-500 to-cyan-400",
        },
        {
            icon: "🤖",
            title: "AI Insight",
            description: "Analisis mendalam oleh Gemini AI dengan setup trading, entry point, target, dan stop loss yang actionable.",
            gradient: "from-purple-500 to-pink-400",
        },
        {
            icon: "📋",
            title: "Analisis Fundamental",
            description: "Data PE, PBV, ROE, dividen, dan laporan keuangan lengkap untuk keputusan investasi jangka panjang.",
            gradient: "from-emerald-500 to-teal-400",
        },
        {
            icon: "🏦",
            title: "Intel Broker",
            description: "Tracking aktivitas broker asing dan domestik, sumbu broker, dan analisis aliran dana.",
            gradient: "from-amber-500 to-orange-400",
        },
        {
            icon: "📈",
            title: "Comparison Tools",
            description: "Bandingkan performa saham sektor secara visual dengan chart overlapping dan metrik side-by-side.",
            gradient: "from-rose-500 to-red-400",
        },
        {
            icon: "💰",
            title: "Foreign Flow Tracker",
            description: "Monitor aliran dana asing harian dan mingguan untuk deteksi akumulasi/distribusi.",
            gradient: "from-indigo-500 to-blue-400",
        },
    ];

    const stats = [
        { value: "50+", label: "Indikator Teknikal" },
        { value: "800+", label: "Saham IDX" },
        { value: "Real-time", label: "Data Yahoo Finance" },
        { value: "AI", label: "Powered by Gemini" },
    ];

    return (
        <div className="min-h-screen bg-surface">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-accent/10 to-transparent rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
                    <div className="text-center">
                        {/* Logo */}
                        <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full bg-surface-card/80 border border-border/50 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/30">
                                <span className="text-white text-sm font-bold">IA</span>
                            </div>
                            <span className="text-lg font-semibold text-text-primary">Internal Analyst</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
                            Analisis Saham IDX
                            <br />
                            <span className="bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Seperti Profesional
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
                            Platform analisis saham Indonesia terlengkap dengan AI Insight,
                            indikator teknikal profesional, dan data fundamental real-time.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-accent/30 transition-all"
                                >
                                    Buka Dashboard
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-accent/30 transition-all"
                                    >
                                        Mulai Sekarang
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-8 py-4 bg-surface-card hover:bg-surface-elevated text-text-primary font-semibold rounded-xl border border-border transition-all"
                                    >
                                        Daftar Gratis
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-text-muted mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-surface-card/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                            Fitur Unggulan
                        </h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Semua yang Anda butuhkan untuk menganalisis saham Indonesia dalam satu platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="group relative bg-surface-card border border-border rounded-2xl p-6 hover:border-accent/30 transition-all overflow-hidden"
                            >
                                {/* Gradient glow on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                                <div className="relative">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-2xl mb-4 shadow-lg`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">
                                Mengapa Internal Analyst?
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { title: "Data Real-Time", desc: "Data harga langsung dari Yahoo Finance dengan delay minimal." },
                                    { title: "Analisis AI", desc: "Gemini AI memberikan insight trading yang actionable, bukan sekadar data." },
                                    { title: "Fokus IDX", desc: "Dirancang khusus untuk pasar saham Indonesia." },
                                    { title: "Gratis", desc: "Akses semua fitur tanpa biaya langganan." },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary">{item.title}</h4>
                                            <p className="text-text-secondary text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Decorative chart preview */}
                        <div className="relative">
                            <div className="bg-surface-card border border-border rounded-2xl p-4 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                </div>
                                <div className="h-64 bg-gradient-to-br from-surface to-surface-elevated rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📈</div>
                                        <p className="text-text-muted text-sm">Interactive Chart Preview</p>
                                    </div>
                                </div>
                            </div>
                            {/* Floating elements */}
                            <div className="absolute -top-4 -right-4 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                                +2.4%
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-surface-card border border-border px-4 py-2 rounded-lg shadow-lg">
                                <span className="text-xs text-text-muted">RSI</span>
                                <span className="ml-2 text-accent font-bold">65.4</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-accent/10 via-surface to-purple-500/10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                        Siap Meningkatkan Analisis Anda?
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Bergabung dengan ratusan investor Indonesia yang sudah menggunakan Internal Analyst.
                    </p>
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-accent/30 transition-all"
                        >
                            Buka Dashboard
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    ) : (
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-accent/30 transition-all"
                        >
                            Daftar Gratis Sekarang
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">IA</span>
                            </div>
                            <span className="text-text-muted text-sm">Internal Analyst © 2025</span>
                        </div>
                        <div className="text-text-muted text-sm">
                            Data dari Yahoo Finance • AI oleh Google Gemini
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
