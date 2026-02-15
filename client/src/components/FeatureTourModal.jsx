import { useState } from "react";

/**
 * FeatureTourModal — Welcome tour shown on first Dashboard visit.
 * Shows a multi-slide carousel explaining all app features.
 */
export default function FeatureTourModal({ isOpen, onClose }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            icon: "👋",
            title: "Selamat Datang di Internal Analyst",
            description: "Platform analisis saham lengkap untuk investor Indonesia. Mari kenali fitur-fitur utama kami!",
        },
        {
            icon: "📊",
            title: "Dashboard & Chart",
            description: "Lihat grafik harga real-time, volume, dan statistik lengkap. Cukup ketik kode saham (BBRI, BBCA, dll) untuk memulai.",
        },
        {
            icon: "✨",
            title: "AI Insight",
            description: "Klik tombol 'Analisis AI' untuk mendapatkan analisis otomatis dari AI tentang tren, support/resistance, dan rekomendasi.",
        },
        {
            icon: "⭐",
            title: "Watchlist",
            description: "Simpan saham favorit ke watchlist dengan klik ikon bintang. Akses cepat dari sidebar kiri.",
        },
        {
            icon: "🏦",
            title: "Bandingkan Saham",
            description: "Bandingkan fundamental 2+ saham side-by-side. Lihat PER, PBV, ROE, dan metrik lainnya dalam satu tabel.",
        },
        {
            icon: "📋",
            title: "Fundamental & Ownership",
            description: "Analisis mendalam: laporan keuangan, struktur kepemilikan, broker activity, dan foreign flow.",
        },
        {
            icon: "🔧",
            title: "Tools Kalkulator",
            description: "8+ kalkulator trading: Average Down, Position Sizing, R:R Ratio, Biaya Transaksi, dan lainnya.",
        },
        {
            icon: "🌐",
            title: "PWA & Offline",
            description: "Install aplikasi ke home screen (Android/iOS) dan gunakan secara offline. Klik ikon install di browser.",
        },
    ];

    if (!isOpen) return null;

    const isFirst = currentSlide === 0;
    const isLast = currentSlide === slides.length - 1;

    const handleNext = () => {
        if (isLast) {
            onClose();
        } else {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirst) setCurrentSlide(currentSlide - 1);
    };

    const handleSkip = () => {
        onClose();
    };

    const slide = slides[currentSlide];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative max-w-lg w-full bg-surface-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-full transition-colors z-10"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="p-8 sm:p-10 text-center space-y-6">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-5xl">
                        {slide.icon}
                    </div>

                    {/* Title + Description */}
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary mb-3">{slide.title}</h2>
                        <p className="text-base text-text-muted leading-relaxed max-w-md mx-auto">
                            {slide.description}
                        </p>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-2 rounded-full transition-all ${i === currentSlide
                                    ? "w-8 bg-accent"
                                    : "w-2 bg-surface-elevated hover:bg-border"
                                    }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                            onClick={handlePrev}
                            disabled={isFirst}
                            className="px-5 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Sebelumnya
                        </button>

                        <span className="text-xs text-text-muted font-medium">
                            {currentSlide + 1} / {slides.length}
                        </span>

                        <button
                            onClick={handleNext}
                            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            {isLast ? "Mulai ✨" : "Lanjut →"}
                        </button>
                    </div>

                    {/* Skip button */}
                    {!isLast && (
                        <button
                            onClick={handleSkip}
                            className="text-xs text-text-muted/50 hover:text-text-muted transition-colors"
                        >
                            Lewati tour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
