import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error("Masukkan email Anda");

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();

            if (data.success) {
                setSent(true);
                toast.success("Link reset password telah dikirim!");
            } else {
                toast.error(data.error || "Gagal mengirim email");
            }
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0f0f12 0%, #1a1a2e 100%)",
                padding: "20px",
            }}>
                <div style={{
                    background: "#1a1a1f",
                    border: "1px solid #2d2d2d",
                    borderRadius: "16px",
                    padding: "40px",
                    maxWidth: "440px",
                    width: "100%",
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
                    <h2 style={{ color: "#fff", margin: "0 0 12px 0", fontSize: "22px" }}>
                        Cek Email Anda
                    </h2>
                    <p style={{ color: "#a0a0a0", lineHeight: 1.6, margin: "0 0 24px 0" }}>
                        Jika email <strong style={{ color: "#ef4444" }}>{email}</strong> terdaftar,
                        kami telah mengirimkan link untuk mereset password Anda.
                    </p>
                    <p style={{ color: "#808080", fontSize: "14px", margin: "0 0 24px 0" }}>
                        Link akan kedaluwarsa dalam <strong>1 jam</strong>.
                        Cek juga folder spam jika tidak menemukan email.
                    </p>
                    <Link
                        to="/login"
                        style={{
                            display: "inline-block",
                            padding: "12px 24px",
                            background: "linear-gradient(135deg, #6366f1, #a855f7)",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: "10px",
                            fontWeight: 600,
                        }}
                    >
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f0f12 0%, #1a1a2e 100%)",
            padding: "20px",
        }}>
            <div style={{
                background: "#1a1a1f",
                border: "1px solid #2d2d2d",
                borderRadius: "16px",
                padding: "40px",
                maxWidth: "440px",
                width: "100%",
            }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔐</div>
                    <h2 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: "24px" }}>
                        Lupa Password?
                    </h2>
                    <p style={{ color: "#a0a0a0", margin: 0, fontSize: "14px" }}>
                        Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: "block", color: "#b0b0b0", marginBottom: "6px", fontSize: "14px" }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        style={{
                            width: "100%",
                            padding: "12px 14px",
                            background: "#0f0f12",
                            border: "1px solid #2d2d2d",
                            borderRadius: "10px",
                            color: "#fff",
                            fontSize: "15px",
                            marginBottom: "20px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "13px",
                            background: loading
                                ? "#333"
                                : "linear-gradient(135deg, #ef4444, #f97316)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "15px",
                            cursor: loading ? "not-allowed" : "pointer",
                            marginBottom: "16px",
                        }}
                    >
                        {loading ? "Mengirim..." : "Kirim Link Reset"}
                    </button>
                </form>

                <div style={{ textAlign: "center" }}>
                    <Link
                        to="/login"
                        style={{ color: "#6366f1", textDecoration: "none", fontSize: "14px" }}
                    >
                        ← Kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
