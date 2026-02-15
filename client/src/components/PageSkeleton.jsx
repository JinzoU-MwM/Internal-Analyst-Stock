/**
 * PageSkeleton — Animated placeholder shown while lazy-loaded pages are being fetched.
 * Used as the Suspense fallback in App.jsx.
 */
export default function PageSkeleton() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-surface-elevated rounded-lg" />
                    <div className="h-4 w-72 bg-surface-elevated/60 rounded-md" />
                </div>
                <div className="h-10 w-32 bg-surface-elevated rounded-xl" />
            </div>

            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-surface-card border border-border rounded-2xl p-5 space-y-3">
                        <div className="h-3 w-20 bg-surface-elevated rounded-md" />
                        <div className="h-6 w-28 bg-surface-elevated rounded-lg" />
                        <div className="h-2 w-full bg-surface-elevated/40 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Chart skeleton */}
            <div className="bg-surface-card border border-border rounded-2xl p-6">
                <div className="h-4 w-36 bg-surface-elevated rounded-md mb-4" />
                <div className="h-64 bg-surface-elevated/30 rounded-xl flex items-end justify-between px-4 pb-4 gap-2">
                    {[40, 65, 45, 80, 55, 70, 35, 60, 75, 50, 85, 42].map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-surface-elevated/60 rounded-t-md"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            </div>

            {/* Table skeleton */}
            <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50">
                    <div className="h-4 w-28 bg-surface-elevated rounded-md" />
                </div>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-3.5 border-b border-border/10"
                    >
                        <div className="h-3 w-24 bg-surface-elevated/50 rounded-md" />
                        <div className="h-3 flex-1 bg-surface-elevated/30 rounded-md" />
                        <div className="h-3 w-16 bg-surface-elevated/50 rounded-md" />
                        <div className="h-3 w-20 bg-surface-elevated/40 rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
}
