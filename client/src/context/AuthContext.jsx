import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides user/token/login/logout.
 * Persists the token + user in localStorage so sessions survive page reloads.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem("ia_user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem("ia_token"));
    const [loading, setLoading] = useState(false);

    /**
     * login — POST /api/auth/login, persist token + user.
     * @returns {{ success: boolean, error?: string }}
     */
    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Login response parse error:", text);
                return { success: false, error: "Server Error: Invalid response format" };
            }

            if (data.success) {
                localStorage.setItem("ia_token", data.token);
                localStorage.setItem("ia_user", JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            }

            return { success: false, error: data.error || "Login gagal" };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * register — POST /api/auth/register, persist token + user.
     */
    const register = useCallback(async (username, email, password) => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem("ia_token", data.token);
                localStorage.setItem("ia_user", JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            }

            return {
                success: false,
                error: data.details?.join(", ") || data.error || "Registrasi gagal",
            };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * logout — clear stored credentials.
     */
    const logout = useCallback(() => {
        localStorage.removeItem("ia_token");
        localStorage.removeItem("ia_user");
        setToken(null);
        setUser(null);
    }, []);

    /**
     * Verify token on mount — if the stored token is expired/invalid, log out.
     */
    useEffect(() => {
        if (!token) return;
        fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (!data.success) logout();
                else {
                    setUser(data.user);
                    localStorage.setItem("ia_user", JSON.stringify(data.user));
                }
            })
            .catch(() => logout());
    }, []); // only on mount

    /**
     * updateProfile — PUT /api/auth/profile, update user state.
     */
    const updateProfile = useCallback(async (profileData) => {
        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                localStorage.setItem("ia_user", JSON.stringify(data.user));
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error || "Update gagal" };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, [token]);

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — convenience hook.
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
