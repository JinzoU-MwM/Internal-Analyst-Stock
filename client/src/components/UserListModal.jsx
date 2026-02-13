import { useState, useEffect } from "react";
import { X, User, Calendar, Shield } from "lucide-react";

export default function UserListModal({ isOpen, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch("/api/auth/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setUsers(data.users);
            } else {
                setError(data.error || "Gagal memuat data user");
            }
        } catch (err) {
            setError("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl max-h-[85vh] rounded-xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Daftar Pengguna
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {users.length} Total
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 text-destructive bg-destructive/5 rounded-xl border border-destructive/20">
                            <p className="font-medium">{error}</p>
                            <button
                                onClick={fetchUsers}
                                className="mt-2 text-sm underline hover:text-destructive/80"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/20 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    {user.username}
                                                    {user.role === "admin" && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-medium border border-accent/20 flex items-center gap-1">
                                                            <Shield size={10} /> ADMIN
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5" title="Tanggal Bergabung">
                                                <Calendar size={14} />
                                                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    Belum ada user lain yang terdaftar.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
