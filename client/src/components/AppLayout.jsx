import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserListModal from "./UserListModal"; // Import modal

/**
 * AppLayout — Responsive shell with sidebar navigation.
 *
 * - Desktop (lg+):  Fixed sidebar w-64 on the left
 * - Tablet/Mobile:  Top navbar with hamburger → slide-over drawer
 *
 * Wraps page content via {children}.
 */
export default function AppLayout({ children }) {
    const { user, isAdmin, logout } = useAuth();
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false); // New state

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
            <nav className="flex-1 px-3 py-4 space-y-1">
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Menu
                </p>
                {navItems.map((item) => (
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
                ))}

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
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                            {user?.username}
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
                </div>
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

                    {/* Quick nav pills on mobile */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`p-2 rounded-lg transition-all ${isActive(item.to)
                                    ? "bg-accent/10 text-accent"
                                    : "text-text-muted hover:bg-surface-elevated"
                                    }`}
                                title={item.label}
                            >
                                {item.icon}
                            </Link>
                        ))}
                    </nav>
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
        </div>
    );
}
