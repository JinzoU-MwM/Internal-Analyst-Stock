import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function WatchlistManagerModal({ isOpen, onClose, watchlist, onUpdate }) {
    if (!isOpen) return null;

    const [items, setItems] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    useEffect(() => {
        if (watchlist) {
            setItems(watchlist);
            const uniqueGroups = [...new Set(watchlist.map(i => i.group || "General"))];
            setGroups(uniqueGroups.sort());
        }
    }, [watchlist]);

    const handleMove = async (symbol, newGroup) => {
        const toastId = toast.loading("Memindahkan...");
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/auth/watchlist/${symbol}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ group: newGroup }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Berhasil dipindahkan", { id: toastId });
                onUpdate(); // Trigger refresh in parent
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            toast.error(err.message || "Gagal memindah", { id: toastId });
        }
    };

    const handleRename = async (oldName, newName) => {
        if (!newName || oldName === newName) return;
        const toastId = toast.loading("Mengubah nama...");
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/auth/watchlist/group`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ oldName, newName }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Nama grup diubah", { id: toastId });
                onUpdate();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            toast.error(err.message || "Gagal mengubah nama", { id: toastId });
        }
    };

    // Organized view
    const groupedItems = {};
    groups.forEach(g => {
        groupedItems[g] = items.filter(i => (i.group || "General") === g);
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Kelola Watchlist</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        ✕
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-6">
                    {/* Add New Group Hint */}
                    <div className="bg-surface-elevated p-3 rounded-lg text-sm text-text-muted">
                        <span className="font-bold text-accent">Tip:</span> Untuk membuat grup baru, pindahkan saham ke nama grup baru (ketik manual).
                    </div>

                    {groups.map(group => (
                        <div key={group} className="bg-surface border border-border rounded-xl overflow-hidden">
                            {/* Group Header */}
                            <div className="bg-surface-elevated px-4 py-2 flex items-center gap-2 border-b border-border">
                                <span className="font-bold text-text-primary flex-1">{group} ({groupedItems[group].length})</span>
                                <button
                                    onClick={() => {
                                        const newName = prompt("Nama baru untuk grup:", group);
                                        if (newName) handleRename(group, newName);
                                    }}
                                    className="text-xs text-accent hover:underline"
                                >
                                    Rename
                                </button>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-border/50">
                                {groupedItems[group].map(item => (
                                    <div key={item.symbol} className="px-4 py-3 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-surface-elevated flex items-center justify-center font-bold text-xs text-text-primary">
                                                {item.symbol}
                                            </div>
                                            <span className="text-sm font-medium text-text-muted">
                                                {new Date(item.addedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <select
                                                className="bg-surface border border-border text-xs text-text-primary rounded px-2 py-1 outline-none focus:border-accent"
                                                value={item.group || "General"}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "__NEW__") {
                                                        const custom = prompt("Nama Grup Baru:");
                                                        if (custom) handleMove(item.symbol, custom);
                                                    } else {
                                                        handleMove(item.symbol, val);
                                                    }
                                                }}
                                            >
                                                {groups.map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                                <option value="__NEW__">+ Grup Baru...</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                {groupedItems[group].length === 0 && (
                                    <div className="p-4 text-center text-xs text-text-muted italic">
                                        Kosong
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-surface-elevated hover:bg-border rounded-lg text-sm font-medium text-text-primary transition-colors"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}
