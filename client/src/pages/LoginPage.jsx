import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

export default function LoginPage() {
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showResend, setShowResend] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState("");
    const [resendLoading, setResendLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setShowResend(false);

        if (!email.trim() || !password.trim()) {
            setError("Email dan password wajib diisi.");
            return;
        }

        const result = await login(email, password);
        if (result.success) {
            navigate("/");
        } else {
            setError(result.error);

            // If email not verified, show resend button
            if (result.code === "EMAIL_NOT_VERIFIED") {
                setShowResend(true);
                setUnverifiedEmail(result.email || email);
            }
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: unverifiedEmail }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Email verifikasi telah dikirim ulang!");
                setShowResend(false);
            } else {
                toast.error(data.error || "Gagal mengirim ulang email");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                        <span className="text-white text-xl font-bold">IA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Internal Analyst
                    </h1>
                    <p className="text-sm text-text-muted mt-1">
                        Masuk ke akun Anda
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-xl">
                    {error && (
                        <div className="bg-bear/10 border border-bear/30 text-bear rounded-lg px-4 py-2.5 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {showResend && (
                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-text-muted mb-3">
                                Belum menerima email verifikasi?
                            </p>
                            <button
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {resendLoading ? "Mengirim..." : "📤 Kirim Ulang Email Verifikasi"}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@perusahaan.com"
                                autoComplete="email"
                                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white font-medium py-3 min-h-[44px] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent/20"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Masuk…
                                </span>
                            ) : (
                                "Masuk"
                            )}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-border text-center">
                        <p className="text-sm text-text-muted">
                            Belum punya akun?{" "}
                            <Link
                                to="/register"
                                className="text-accent hover:text-accent-hover font-medium transition-colors"
                            >
                                Daftar
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
