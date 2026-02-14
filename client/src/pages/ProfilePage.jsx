import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const { user, token, updateProfile } = useAuth();

    // Profile form state
    const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [profileSaving, setProfileSaving] = useState(false);

    // Password form state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [showOldPw, setShowOldPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const initial = (user?.displayName || user?.username || "U")[0].toUpperCase();
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
        : "–";

    // ── Save profile ────────────────────────────────────────────
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        const result = await updateProfile({ displayName, bio });
        setProfileSaving(false);
        if (result.success) {
            toast.success("Profil berhasil diperbarui");
        } else {
            toast.error(result.error);
        }
    };

    // ── Change password ─────────────────────────────────────────
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Konfirmasi password tidak cocok");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password baru minimal 6 karakter");
            return;
        }
        setPasswordSaving(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Password berhasil diubah");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("Gagal mengubah password");
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
            {/* ── Profile Header ─────────────────────────────────── */}
            <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                {/* Gradient banner */}
                <div className="h-28 bg-gradient-to-br from-accent/30 via-purple-500/20 to-accent/10 relative">
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-accent/20 ring-4 ring-surface-card">
                            {initial}
                        </div>
                    </div>
                </div>
                <div className="pt-14 px-6 pb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">
                                {user?.displayName || user?.username}
                            </h1>
                            <p className="text-sm text-text-muted">@{user?.username}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user?.role === "admin"
                                ? "bg-bull/10 text-bull border border-bull/20"
                                : "bg-accent/10 text-accent border border-accent/20"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user?.role === "admin" ? "bg-bull" : "bg-accent"}`} />
                            {user?.role === "admin" ? "Admin" : "Analyst"}
                        </span>
                    </div>
                    {bio && (
                        <p className="mt-3 text-sm text-text-secondary leading-relaxed">{bio}</p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {user?.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Bergabung {memberSince}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Edit Profile ───────────────────────────────────── */}
            <div className="bg-surface-card border border-border rounded-2xl p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <svg className="w-4.5 h-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profil
                </h2>
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={50}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all"
                            placeholder="Nama tampilan"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={200}
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all resize-none"
                            placeholder="Tulis bio singkat tentang dirimu..."
                        />
                        <p className="text-right text-[11px] text-text-muted mt-1">{bio.length}/200</p>
                    </div>
                    <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {profileSaving ? "Menyimpan..." : "Simpan Profil"}
                    </button>
                </form>
            </div>

            {/* ── Change Password ─────────────────────────────────── */}
            <div className="bg-surface-card border border-border rounded-2xl p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <svg className="w-4.5 h-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Ubah Password
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="relative">
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Password Lama</label>
                        <input
                            type={showOldPw ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all pr-10"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOldPw(!showOldPw)}
                            className="absolute right-3 top-8 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {showOldPw
                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                }
                            </svg>
                        </button>
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Password Baru</label>
                        <input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all pr-10"
                            placeholder="Minimal 6 karakter"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3 top-8 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {showNewPw
                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                }
                            </svg>
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl bg-surface border text-text-primary text-sm placeholder-text-muted/50 focus:outline-none focus:ring-2 transition-all ${confirmPassword && confirmPassword !== newPassword
                                    ? "border-bear focus:ring-bear/40"
                                    : "border-border focus:ring-accent/40 focus:border-accent/40"
                                }`}
                            placeholder="Ketik ulang password baru"
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-[11px] text-bear mt-1">Password tidak cocok</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={passwordSaving || !oldPassword || !newPassword || newPassword !== confirmPassword}
                        className="px-5 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm font-medium hover:bg-surface-elevated/80 disabled:opacity-40 transition-all cursor-pointer"
                    >
                        {passwordSaving ? "Mengubah..." : "Ubah Password"}
                    </button>
                </form>
            </div>

            {/* ── Account Info ────────────────────────────────────── */}
            <div className="bg-surface-card border border-border rounded-2xl p-6">
                <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <svg className="w-4.5 h-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Informasi Akun
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface rounded-xl p-4 border border-border/50">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Username</p>
                        <p className="text-sm font-medium text-text-primary">@{user?.username}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 border border-border/50">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Role</p>
                        <p className="text-sm font-medium text-text-primary capitalize">{user?.role}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 border border-border/50">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4 border border-border/50">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Bergabung</p>
                        <p className="text-sm font-medium text-text-primary">{memberSince}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
