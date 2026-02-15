import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserListModal from "./UserListModal";
import WatchlistManagerModal from "./WatchlistManagerModal";

// Helper Component for Collapsible Groups
// Helper to build the correct URL based on current page
const getTickerUrl = (ticker, currentPath) => {
    // Detect which page we're on
    if (currentPath.startsWith("/ownership")) return `/ownership?ticker=${ticker}`;
    if (currentPath.startsWith("/comparison")) return `/comparison?ticker=${ticker}`;
    if (currentPath.startsWith("/fundamental")) return `/fundamental/${ticker}`;
    // Default: if on dashboard (/) or unknown, go to fundamental
    return `/fundamental/${ticker}`;
};

const SidebarGroup = ({ title, items, defaultOpen = false, iconColor = "bg-accent/50", currentPath = "/" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (!items || items.length === 0) return null;

    return (
        <div className="px-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 mb-1 bg-surface-elevated/30 hover:bg-surface-elevated/50 rounded text-xs font-medium text-text-primary transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${iconColor}`} />
                    {title}
                </div>
                <svg
                    className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {isOpen && (
                <div className="space-y-0.5 ml-1 border-l-2 border-border/50 pl-2 animate-fade-in-down origin-top">
                    {items.map((item) => {
                        const symbol = item.symbol || item;
                        return (
                            <Link
                                key={symbol}
                                to={getTickerUrl(symbol, currentPath)}
                                className="block px-2 py-1.5 rounded text-xs text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors truncate"
                            >
                                {symbol}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function AppLayout({ children }) {
    const { user, isAdmin, logout } = useAuth();
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [watchlist, setWatchlist] = useState([]); // Raw user items
    const [groupedWatchlist, setGroupedWatchlist] = useState({}); // User items grouped
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);

    // Fetch watchlist on mount
    const fetchWatchlist = async () => {
        try {
            const token = user?.token || localStorage.getItem("ia_token");
            if (!token) return;

            const res = await fetch("/api/auth/watchlist", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setWatchlist(data.watchlist);

                // Group user items
                const groups = {};
                data.watchlist.forEach(item => {
                    const g = item.group || "General";
                    if (!groups[g]) groups[g] = [];
                    groups[g].push(item);
                });
                setGroupedWatchlist(groups);
            }
        } catch (err) {
            console.error("Failed to fetch watchlist:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchWatchlist();
        }

        const handleWatchlistUpdate = () => fetchWatchlist();
        window.addEventListener("watchlist-updated", handleWatchlistUpdate);
        return () => window.removeEventListener("watchlist-updated", handleWatchlistUpdate);
    }, [user]);

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Close drawer on Escape
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
        if (drawerOpen) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [drawerOpen]);

    // ── Nav items ────────────────────────────────────────
    const navItems = [
        {
            label: "Chart",
            to: "/",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l4-4 4 4 4-8 4 4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h18" />
                </svg>
            ),
        },
        {
            label: "Fundamental",
            to: "/fundamental",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            label: "Comparison",
            to: "/comparison",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
        },
        {
            label: "Ownership",
            to: "/ownership",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            label: "Info Harian",
            to: "/info-harian",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
            ),
        },
        {
            label: "Foreign Flow",
            to: "/foreign-flow",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
        },
        {
            label: "Konglomerat",
            to: "/konglomerat",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            label: "MSCI Screener",
            to: "/msci-screener",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            label: "Broker",
            to: "/broker",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        },
        {
            label: "Tools",
            to: "/tools",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    const isActive = (to) => {
        if (to === "/") return pathname === "/";
        return pathname.startsWith(to);
    };

    // ── Shared sidebar content (used by desktop & mobile) ─
    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
                    <span className="text-white text-sm font-bold">IA</span>
                </div>
                <div>
                    <h1 className="text-sm font-bold text-text-primary leading-tight">
                        Internal Analyst
                    </h1>
                    <p className="text-[11px] text-text-muted leading-tight">
                        Stock Dashboard
                    </p>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Menu
                </p>
                {navItems.map((item) =>
                    item.subItems ? (
                        <div key={item.label}>
                            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${item.subItems.some((s) => isActive(s.to))
                                ? "text-accent"
                                : "text-text-muted"
                                }`}>
                                {item.icon}
                                {item.label}
                            </div>
                            <div className="ml-8 space-y-0.5 mt-0.5">
                                {item.subItems.map((sub) => (
                                    <Link
                                        key={sub.to}
                                        to={sub.to}
                                        className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive(sub.to)
                                            ? "bg-accent/10 text-accent"
                                            : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
                                            }`}
                                    >
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.to)
                                ? "bg-accent/10 text-accent shadow-sm"
                                : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    )
                )}

                {/* Watchlist Section */}
                <div className="mt-6 pt-4 border-t border-border/50">
                    <div className="px-3 mb-2 flex items-center justify-between group">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            My Watchlist
                        </p>
                        <button
                            onClick={() => setShowWatchlistModal(true)}
                            className="text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Manage Watchlist"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-1">
                        {Object.entries(groupedWatchlist).map(([groupName, items]) => (
                            <SidebarGroup
                                key={groupName}
                                title={`${groupName} (${items.length})`}
                                items={items}
                                defaultOpen={true}
                                currentPath={pathname}
                            />
                        ))}
                    </div>
                </div>


                {/* Admin Section */}
                {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Admin
                        </p>
                        <button
                            onClick={() => setShowUserModal(true)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all text-left"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            User List
                        </button>
                    </div>
                )}
            </nav>

            {/* User section */}
            <div className="border-t border-border/50 px-4 py-4">
                <Link to="/profile" className="flex items-center gap-3 mb-3 hover:bg-surface-elevated rounded-xl p-1.5 -m-1.5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                        {(user?.displayName || user?.username)?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                            {user?.displayName || user?.username}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                            {isAdmin ? (
                                <span className="inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-bull" />
                                    Admin
                                </span>
                            ) : (
                                "Analyst"
                            )}
                        </p>
                    </div>
                </Link>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 text-sm text-text-muted hover:text-bear px-3 py-2 rounded-lg hover:bg-bear/10 transition-all cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-surface">
            {/* ─── Desktop Sidebar (lg+) ───────────────────────── */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-surface-card border-r border-border z-40">
                {sidebarContent}
            </aside>

            {/* ─── Mobile Top Navbar ───────────────────────────── */}
            <header className="lg:hidden sticky top-0 z-50 bg-surface-card/90 backdrop-blur-xl border-b border-border">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">IA</span>
                            </div>
                            <span className="text-sm font-bold text-text-primary">
                                Internal Analyst
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Mobile Drawer Overlay ─────────────────────────── */}
            {drawerOpen && (
                <div className="lg:hidden fixed inset-0 z-[200]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setDrawerOpen(false)}
                    />
                    {/* Drawer panel */}
                    <aside className="relative w-72 max-w-[80vw] h-full bg-surface-card shadow-2xl flex flex-col animate-slide-in-left">
                        {/* Close button */}
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer z-10"
                            aria-label="Close menu"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* ─── Main Content ──────────────────────────────────── */}
            <main className="lg:ml-64 min-h-screen">
                {children}
            </main>

            <UserListModal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
            />
            <WatchlistManagerModal
                isOpen={showWatchlistModal}
                onClose={() => setShowWatchlistModal(false)}
                watchlist={watchlist}
                onUpdate={fetchWatchlist}
            />
        </div>
    );
}
