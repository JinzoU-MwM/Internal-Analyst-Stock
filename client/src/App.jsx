import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";

// ── Lazy-loaded pages (code-split into separate chunks) ─────────
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FundamentalPage = lazy(() => import("./pages/FundamentalPage"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const OwnershipPage = lazy(() => import("./pages/OwnershipPage"));
const InfoHarianPage = lazy(() => import("./pages/InfoHarianPage"));
const BrokerPage = lazy(() => import("./pages/BrokerPage"));
const ForeignFlowPage = lazy(() => import("./pages/ForeignFlowPage"));
const KonglomeratPage = lazy(() => import("./pages/KonglomeratPage"));
const MSCIScreenerPage = lazy(() => import("./pages/MSCIScreenerPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));

/**
 * ProtectedRoute — redirects to /login if user is not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * GuestRoute — redirects to /dashboard if user is already authenticated.
 */
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * Page — wraps each page in ErrorBoundary + Suspense for isolated error
 * handling and skeleton loading while the lazy chunk downloads.
 */
function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1e1e1e',
          color: '#e0e0e0',
          border: '1px solid #2d2d2d',
        },
      }} />
      <AuthProvider>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Landing page — public */}
            <Route path="/" element={<Page><LandingPage /></Page>} />

            {/* Auth pages — only for guests (no sidebar) */}
            <Route path="/login" element={<GuestRoute><Page><LoginPage /></Page></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Page><RegisterPage /></Page></GuestRoute>} />
            <Route path="/verify-email/:token" element={<Page><VerifyEmailPage /></Page>} />
            <Route path="/forgot-password" element={<GuestRoute><Page><ForgotPasswordPage /></Page></GuestRoute>} />
            <Route path="/reset-password/:token" element={<Page><ResetPasswordPage /></Page>} />

            {/* Protected pages — wrapped in AppLayout sidebar */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Page><Dashboard /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/fundamental" element={
              <ProtectedRoute>
                <AppLayout><Page><FundamentalPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/fundamental/:ticker" element={
              <ProtectedRoute>
                <AppLayout><Page><FundamentalPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/comparison" element={
              <ProtectedRoute>
                <AppLayout><Page><ComparisonPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/ownership" element={
              <ProtectedRoute>
                <AppLayout><Page><OwnershipPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/info-harian" element={
              <ProtectedRoute>
                <AppLayout><Page><InfoHarianPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/foreign-flow" element={
              <ProtectedRoute>
                <AppLayout><Page><ForeignFlowPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/konglomerat" element={
              <ProtectedRoute>
                <AppLayout><Page><KonglomeratPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/msci-screener" element={
              <ProtectedRoute>
                <AppLayout><Page><MSCIScreenerPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/tools" element={
              <ProtectedRoute>
                <AppLayout><Page><ToolsPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/broker" element={
              <ProtectedRoute>
                <AppLayout><Page><BrokerPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout><Page><ProfilePage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <AppLayout><Page><SubscriptionPage /></Page></AppLayout>
              </ProtectedRoute>
            } />
            {/* Backward-compatible redirects */}
            <Route path="/broker-analysis" element={<Navigate to="/broker" replace />} />
            <Route path="/broksum" element={<Navigate to="/broker" replace />} />
            <Route path="/broker-intel" element={<Navigate to="/broker" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
      <Analytics />
    </BrowserRouter>
  );
}
