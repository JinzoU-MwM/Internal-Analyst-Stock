import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * GoogleSignInButton — renders the Google "Sign in with Google" button
 * using Google Identity Services (GSI).
 */
export default function GoogleSignInButton({ onSuccess, text = "signin_with" }) {
    const btnRef = useRef(null);
    const navigate = useNavigate();

    const handleCredentialResponse = useCallback(async (response) => {
        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem("ia_token", data.token);
                toast.success(`Selamat datang, ${data.user.displayName || data.user.username}! 🎉`);
                if (onSuccess) {
                    onSuccess(data);
                } else {
                    navigate("/");
                    window.location.reload();
                }
            } else {
                toast.error(data.error || "Gagal login dengan Google");
            }
        } catch {
            toast.error("Terjadi kesalahan saat login dengan Google");
        }
    }, [navigate, onSuccess]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        const initGoogle = () => {
            if (!window.google?.accounts?.id) return;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });

            if (btnRef.current) {
                window.google.accounts.id.renderButton(btnRef.current, {
                    type: "standard",
                    theme: "filled_black",
                    size: "large",
                    width: btnRef.current.offsetWidth || 320,
                    text,
                    shape: "pill",
                    logo_alignment: "left",
                });
            }
        };

        // GSI script may load after this component mounts
        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [handleCredentialResponse, text]);

    if (!GOOGLE_CLIENT_ID) return null;

    return (
        <div
            ref={btnRef}
            style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                minHeight: "44px",
            }}
        />
    );
}
