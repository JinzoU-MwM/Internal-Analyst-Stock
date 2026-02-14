/**
 * API helper — prepends the backend base URL in production.
 * In development, Vite proxy handles `/api` → localhost:5000.
 * In production, VITE_API_URL points to `https://saham.jamnasindo.id`.
 */
const API_BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
    return `${API_BASE}${path}`;
}
