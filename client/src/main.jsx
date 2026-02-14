import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Global fetch wrapper for production API routing ──────────
const API_BASE = import.meta.env.VITE_API_URL || "";
if (API_BASE) {
  const _fetch = window.fetch;
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      input = API_BASE + input;
    }
    return _fetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
