import { Link } from "react-router-dom";

/**
 * WelcomeHint — Guided onboarding card shown when a page has no data yet.
 * Provides context about the page's purpose and quick-start actions.
 *
 * Props:
 *   icon      — emoji or SVG element
 *   title     — main heading
 *   subtitle  — brief description of the page
 *   tips      — array of { icon, text } hint items
 *   actions   — array of { label, to?, onClick?, primary? } buttons
 */
export default function WelcomeHint({ icon, title, subtitle, tips = [], actions = [] }) {
    return (
        <div className="flex items-center justify-center py-12 px-4 animate-fade-in">
            <div className="max-w-lg w-full text-center space-y-6">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-4xl">
                    {icon}
                </div>

                {/* Title + subtitle */}
                <div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
                    <p className="text-sm text-text-muted leading-relaxed max-w-md mx-auto">{subtitle}</p>
                </div>

                {/* Tips */}
                {tips.length > 0 && (
                    <div className="bg-surface-card border border-border rounded-2xl p-5 text-left space-y-3">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-3">
                            💡 Cara Memulai
                        </p>
                        {tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                                <p className="text-sm text-text-muted leading-relaxed">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {actions.length > 0 && (
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {actions.map((action, i) =>
                            action.to ? (
                                <Link
                                    key={i}
                                    to={action.to}
                                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${action.primary
                                        ? "bg-accent hover:bg-accent/90 text-white"
                                        : "bg-surface-elevated hover:bg-surface-card text-text-muted border border-border"
                                        }`}
                                >
                                    {action.label}
                                </Link>
                            ) : (
                                <button
                                    key={i}
                                    onClick={action.onClick}
                                    className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${action.primary
                                        ? "bg-accent hover:bg-accent/90 text-white"
                                        : "bg-surface-elevated hover:bg-surface-card text-text-muted border border-border"
                                        }`}
                                >
                                    {action.label}
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
