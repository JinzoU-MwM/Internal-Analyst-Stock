import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        verifyEmail();
    }, [token]);

    const verifyEmail = async () => {
        try {
            const res = await fetch(`/api/auth/verify-email/${token}`);
            const data = await res.json();

            if (data.success) {
                setStatus("success");
                setMessage(data.message);

                // Store token and auto-login
                if (data.token) {
                    localStorage.setItem("ia_token", data.token);
                }

                toast.success("Email berhasil diverifikasi! 🎉");

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate("/dashboard");
                }, 2000);
            } else {
                setStatus("error");
                setMessage(data.error || "Verifikasi gagal");
                toast.error(data.error);
            }
        } catch (error) {
            setStatus("error");
            setMessage("Terjadi kesalahan saat verifikasi");
            toast.error("Gagal verifikasi email");
            console.error("Verification error:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-surface-card border border-border rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
                {status === "verifying" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-3">
                            Memverifikasi Email...
                        </h1>
                        <p className="text-text-muted">
                            Mohon tunggu sebentar
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl">
                            ✓
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-3">
                            Email Terverifikasi! 🎉
                        </h1>
                        <p className="text-text-muted mb-6">
                            {message}
                        </p>
                        <p className="text-sm text-text-muted/70">
                            Mengalihkan ke dashboard...
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
                            ✕
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-3">
                            Verifikasi Gagal
                        </h1>
                        <p className="text-text-muted mb-8">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Ke Halaman Login
                            </button>
                            <button
                                onClick={() => navigate("/register")}
                                className="w-full bg-surface-elevated hover:bg-border text-text-primary font-medium py-3 rounded-xl transition-colors"
                            >
                                Daftar Ulang
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
