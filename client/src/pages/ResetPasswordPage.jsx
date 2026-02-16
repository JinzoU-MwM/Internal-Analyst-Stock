import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("form"); // form | success | error
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            return toast.error("Password minimal 6 karakter");
        }
        if (password !== confirmPassword) {
            return toast.error("Password tidak cocok");
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/auth/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (data.success) {
                setStatus("success");

                // Store token for auto-login
                if (data.token) {
                    localStorage.setItem("ia_token", data.token);
                }

                toast.success("Password berhasil direset! 🎉");

                setTimeout(() => {
                    navigate("/");
                    window.location.reload();
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(data.error || "Gagal mereset password");
                toast.error(data.error);
            }
        } catch {
            setStatus("error");
            setErrorMsg("Terjadi kesalahan. Coba lagi.");
            toast.error("Gagal mereset password");
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f12 0%, #1a1a2e 100%)",
        padding: "20px",
    };

    const cardStyle = {
        background: "#1a1a1f",
        border: "1px solid #2d2d2d",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "440px",
        width: "100%",
        textAlign: "center",
    };

    if (status === "success") {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                    <h2 style={{ color: "#fff", margin: "0 0 12px 0" }}>Password Berhasil Direset!</h2>
                    <p style={{ color: "#a0a0a0", margin: "0 0 20px 0" }}>
                        Anda akan dialihkan ke dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
                    <h2 style={{ color: "#fff", margin: "0 0 12px 0" }}>Reset Gagal</h2>
                    <p style={{ color: "#ef4444", margin: "0 0 24px 0" }}>{errorMsg}</p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <Link
                            to="/forgot-password"
                            style={{
                                padding: "12px 20px",
                                background: "linear-gradient(135deg, #ef4444, #f97316)",
                                color: "#fff",
                                textDecoration: "none",
                                borderRadius: "10px",
                                fontWeight: 600,
                                fontSize: "14px",
                            }}
                        >
                            Coba Lagi
                        </Link>
                        <Link
                            to="/login"
                            style={{
                                padding: "12px 20px",
                                background: "#2d2d2d",
                                color: "#fff",
                                textDecoration: "none",
                                borderRadius: "10px",
                                fontWeight: 600,
                                fontSize: "14px",
                            }}
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={{ ...cardStyle, textAlign: "left" }}>
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔑</div>
                    <h2 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: "24px" }}>
                        Buat Password Baru
                    </h2>
                    <p style={{ color: "#a0a0a0", margin: 0, fontSize: "14px" }}>
                        Masukkan password baru untuk akun Anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <label style={{ display: "block", color: "#b0b0b0", marginBottom: "6px", fontSize: "14px" }}>
                        Password Baru
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        minLength={6}
                        style={{
                            width: "100%",
                            padding: "12px 14px",
                            background: "#0f0f12",
                            border: "1px solid #2d2d2d",
                            borderRadius: "10px",
                            color: "#fff",
                            fontSize: "15px",
                            marginBottom: "16px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />

                    <label style={{ display: "block", color: "#b0b0b0", marginBottom: "6px", fontSize: "14px" }}>
                        Konfirmasi Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        required
                        minLength={6}
                        style={{
                            width: "100%",
                            padding: "12px 14px",
                            background: "#0f0f12",
                            border: "1px solid #2d2d2d",
                            borderRadius: "10px",
                            color: "#fff",
                            fontSize: "15px",
                            marginBottom: "24px",
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
                        }}
                    >
                        {loading ? "Mereset..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
