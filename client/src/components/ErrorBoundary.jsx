import { Component } from "react";
import { Link } from "react-router-dom";

/**
 * ErrorBoundary — Catches runtime errors in child components and shows
 * a styled fallback instead of a blank screen.
 *
 * Usage: <ErrorBoundary><SomePage /></ErrorBoundary>
 *
 * React error boundaries MUST be class components — hooks don't support
 * componentDidCatch / getDerivedStateFromError.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, showDetails: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    // Reset on navigation (new children)
    componentDidUpdate(prevProps) {
        if (prevProps.children !== this.props.children && this.state.hasError) {
            this.setState({ hasError: false, error: null, showDetails: false });
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        const { error, showDetails } = this.state;

        return (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>

                    {/* Message */}
                    <div>
                        <h2 className="text-xl font-bold text-text-primary mb-2">
                            Terjadi Kesalahan
                        </h2>
                        <p className="text-sm text-text-muted">
                            Halaman ini mengalami error. Coba muat ulang atau kembali ke dashboard.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => this.setState({ hasError: false, error: null, showDetails: false })}
                            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                        >
                            🔄 Muat Ulang
                        </button>
                        <Link
                            to="/"
                            className="px-5 py-2.5 bg-surface-elevated hover:bg-surface-card text-text-muted text-sm font-medium rounded-xl border border-border transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>

                    {/* Error details (collapsible) */}
                    <div>
                        <button
                            onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                            className="text-xs text-text-muted/50 hover:text-text-muted transition-colors cursor-pointer"
                        >
                            {showDetails ? "▾ Sembunyikan detail" : "▸ Lihat detail error"}
                        </button>
                        {showDetails && error && (
                            <pre className="mt-3 p-4 bg-surface-elevated rounded-xl text-left text-[11px] text-red-300/80 overflow-x-auto max-h-40 border border-border/50">
                                {error.message}
                                {error.stack && "\n\n" + error.stack.split("\n").slice(1, 6).join("\n")}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
