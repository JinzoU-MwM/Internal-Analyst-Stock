import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function SubscriptionPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [trialLoading, setTrialLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentPayment, setCurrentPayment] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [plansRes, statusRes, historyRes] = await Promise.all([
                fetch("/api/subscription/plans"),
                fetch("/api/subscription/status", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("ia_token")}` },
                }),
                fetch("/api/subscription/history", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("ia_token")}` },
                }),
            ]);

            const plansData = await plansRes.json();
            const statusData = await statusRes.json();
            const historyData = await historyRes.json();

            if (plansData.success) setPlans(plansData.plans);
            if (statusData.success) setSubscription(statusData.subscription);
            if (historyData.success) setPayments(historyData.payments);
        } catch (err) {
            console.error("Failed to fetch subscription data:", err);
            toast.error("Gagal memuat data subscription");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStartTrial = async () => {
        setTrialLoading(true);
        try {
            const res = await fetch("/api/subscription/start-trial", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("ia_token")}`,
                },
            });
            const data = await res.json();

            if (data.success) {
                toast.success(data.message);
                fetchData();
            } else {
                toast.error(data.error || "Gagal memulai trial");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan");
        } finally {
            setTrialLoading(false);
        }
    };

    const handleCheckout = async (method = "qris") => {
        setCheckoutLoading(true);
        try {
            const res = await fetch("/api/subscription/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("ia_token")}`,
                },
                body: JSON.stringify({ method }),
            });
            const data = await res.json();

            if (data.success) {
                setCurrentPayment(data.payment);
                setShowPaymentModal(true);
                toast.success("Payment berhasil dibuat!");
            } else {
                toast.error(data.error || "Gagal membuat payment");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleVerifyPayment = async (orderId) => {
        try {
            const res = await fetch(`/api/subscription/verify/${orderId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("ia_token")}` },
            });
            const data = await res.json();

            if (data.success && data.payment?.status === "paid") {
                toast.success("Payment berhasil! Subscription aktif.");
                setShowPaymentModal(false);
                fetchData();
            } else if (data.payment?.status === "pending") {
                toast("Payment masih pending. Silakan selesaikan pembayaran.", { icon: "⏳" });
            } else {
                toast.error("Payment belum selesai");
            }
        } catch (err) {
            toast.error("Gagal verifikasi payment");
        }
    };

    const fmt = (v) => (v != null ? v.toLocaleString("id-ID") : "-");

    if (loading) {
        return (
            <div className="p-6 animate-pulse space-y-6">
                <div className="h-8 w-48 bg-surface-elevated rounded" />
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-64 bg-surface-card rounded-2xl" />
                    <div className="h-64 bg-surface-card rounded-2xl" />
                </div>
            </div>
        );
    }

    const isActive = subscription?.isActive;
    const isTrial = subscription?.isTrial;

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Premium Subscription</h1>
                <p className="text-text-muted mt-1">
                    Dapatkan akses ke fitur AI Insight dan MSCI Screener
                </p>
            </div>

            {/* Current Status Card */}
            {subscription && (
                <div className={`rounded-2xl p-6 border ${isActive ? "bg-emerald-500/10 border-emerald-500/30" : "bg-surface-card border-border"}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-muted">Status Subscription</p>
                            <p className={`text-xl font-bold ${isActive ? "text-emerald-400" : "text-text-primary"}`}>
                                {isActive ? (isTrial ? "Trial Premium" : "Premium Active") : "Free Plan"}
                            </p>
                            {subscription.daysRemaining > 0 && (
                                <p className="text-sm text-text-muted mt-1">
                                    {isTrial ? "Trial" : "Subscription"} berakhir dalam {subscription.daysRemaining} hari
                                </p>
                            )}
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-elevated text-text-muted"}`}>
                            {subscription.plan?.toUpperCase() || "FREE"}
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`rounded-2xl p-6 border relative ${
                            plan.highlighted
                                ? "bg-gradient-to-b from-accent/10 to-surface-card border-accent/30"
                                : "bg-surface-card border-border"
                        }`}
                    >
                        {plan.highlighted && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
                                POPULER
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                        <div className="mt-2">
                            <span className="text-3xl font-bold text-text-primary">
                                Rp {fmt(plan.price)}
                            </span>
                            {plan.price > 0 && <span className="text-text-muted">/bulan</span>}
                        </div>
                        {plan.trialDays && (
                            <p className="text-sm text-accent mt-1">
                                + {plan.trialDays} hari gratis trial
                            </p>
                        )}
                        <ul className="mt-4 space-y-2">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                    <span className="text-emerald-400 mt-0.5">✓</span>
                                    {feature}
                                </li>
                            ))}
                            {plan.limitations?.map((lim, i) => (
                                <li key={`lim-${i}`} className="flex items-start gap-2 text-sm text-text-muted">
                                    <span className="text-red-400 mt-0.5">✗</span>
                                    {lim}
                                </li>
                            ))}
                        </ul>

                        {/* Action Button */}
                        {plan.id === "premium" && !isActive && (
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => handleCheckout("qris")}
                                    disabled={checkoutLoading}
                                    className="w-full py-3 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {checkoutLoading ? "Memproses..." : `Bayar Rp ${fmt(plan.price)}`}
                                </button>
                                {!subscription?.trialEndsAt && (
                                    <button
                                        onClick={handleStartTrial}
                                        disabled={trialLoading}
                                        className="w-full py-3 bg-surface-elevated hover:bg-surface-border text-text-primary font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer border border-border"
                                    >
                                        {trialLoading ? "Memproses..." : `Coba Gratis ${plan.trialDays} Hari`}
                                    </button>
                                )}
                            </div>
                        )}

                        {plan.id === "premium" && isActive && (
                            <div className="mt-6">
                                <div className="w-full py-3 bg-emerald-500/20 text-emerald-400 font-medium rounded-xl text-center">
                                    {isTrial ? "Sedang Trial" : "Sudah Active"}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
                <div className="bg-surface-card border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">Riwayat Payment</h2>
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <div
                                key={payment._id}
                                className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl"
                            >
                                <div>
                                    <p className="font-mono text-sm text-text-primary">{payment.orderId}</p>
                                    <p className="text-xs text-text-muted">
                                        {new Date(payment.createdAt).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-text-primary">Rp {fmt(payment.amount)}</p>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                            payment.status === "paid"
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : payment.status === "pending"
                                                ? "bg-amber-500/20 text-amber-400"
                                                : "bg-red-500/20 text-red-400"
                                        }`}
                                    >
                                        {payment.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && currentPayment && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowPaymentModal(false)}
                >
                    <div
                        className="bg-surface-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-text-primary">Payment Instructions</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-text-primary">
                                    Rp {fmt(currentPayment.amount)}
                                </p>
                                <p className="text-sm text-text-muted mt-1">
                                    Method: {currentPayment.method?.toUpperCase()}
                                </p>
                            </div>

                            {currentPayment.qrCodeUrl && (
                                <div className="flex justify-center">
                                    <img
                                        src={currentPayment.qrCodeUrl}
                                        alt="QR Code"
                                        className="w-48 h-48 rounded-lg"
                                    />
                                </div>
                            )}

                            {currentPayment.vaNumber && (
                                <div className="bg-surface-elevated rounded-xl p-4 text-center">
                                    <p className="text-xs text-text-muted">Virtual Account Number</p>
                                    <p className="text-xl font-mono font-bold text-text-primary mt-1">
                                        {currentPayment.vaNumber}
                                    </p>
                                </div>
                            )}

                            {currentPayment.expiredAt && (
                                <p className="text-center text-sm text-text-muted">
                                    Berlaku sampai{" "}
                                    {new Date(currentPayment.expiredAt).toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            )}

                            <button
                                onClick={() => handleVerifyPayment(currentPayment.orderId)}
                                className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all cursor-pointer"
                            >
                                Saya Sudah Bayar
                            </button>
                        </div>
                        <div className="px-6 py-4 border-t border-border">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full text-center text-sm text-text-muted hover:text-text-primary cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
