import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
            setError("Semua field wajib diisi.");
            return;
        }

        const result = await register(form.username, form.email, form.password);
        if (result.success) {
            navigate("/");
        } else {
            setError(result.error);
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
                        Buat Akun Baru
                    </h1>
                    <p className="text-sm text-text-muted mt-1">
                        Daftar untuk mulai menganalisis
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-xl">
                    {error && (
                        <div className="bg-bear/10 border border-bear/30 text-bear rounded-lg px-4 py-2.5 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={(e) => update("username", e.target.value)}
                                placeholder="contoh: andi"
                                autoComplete="username"
                                className="w-full bg-surface-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
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
                                value={form.password}
                                onChange={(e) => update("password", e.target.value)}
                                placeholder="Minimal 6 karakter"
                                autoComplete="new-password"
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
                                    Mendaftar…
                                </span>
                            ) : (
                                "Daftar"
                            )}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-border text-center">
                        <p className="text-sm text-text-muted">
                            Sudah punya akun?{" "}
                            <Link
                                to="/login"
                                className="text-accent hover:text-accent-hover font-medium transition-colors"
                            >
                                Masuk
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
