import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import FundamentalPage from "./pages/FundamentalPage";
import ComparisonPage from "./pages/ComparisonPage";
import OwnershipPage from "./pages/OwnershipPage";
import InfoHarianPage from "./pages/InfoHarianPage";
import BrokerPage from "./pages/BrokerPage";
import ForeignFlowPage from "./pages/ForeignFlowPage"; // Clean import
import KonglomeratPage from "./pages/KonglomeratPage";
import MSCIScreenerPage from "./pages/MSCIScreenerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import ToolsPage from "./pages/ToolsPage";

/**
 * ProtectedRoute — redirects to /login if user is not authenticated.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * GuestRoute — redirects to / if user is already authenticated.
 */
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

import { Toaster } from 'react-hot-toast';

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
        <Routes>
          {/* Auth pages — only for guests (no sidebar) */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected pages — wrapped in AppLayout sidebar */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fundamental" element={
            <ProtectedRoute>
              <AppLayout><FundamentalPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fundamental/:ticker" element={
            <ProtectedRoute>
              <AppLayout><FundamentalPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/comparison" element={
            <ProtectedRoute>
              <AppLayout><ComparisonPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/ownership" element={
            <ProtectedRoute>
              <AppLayout><OwnershipPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/info-harian" element={
            <ProtectedRoute>
              <AppLayout><InfoHarianPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/foreign-flow" element={
            <ProtectedRoute>
              <AppLayout><ForeignFlowPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/konglomerat" element={
            <ProtectedRoute>
              <AppLayout><KonglomeratPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/msci-screener" element={
            <ProtectedRoute>
              <AppLayout><MSCIScreenerPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/tools" element={
            <ProtectedRoute>
              <AppLayout><ToolsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/broker" element={
            <ProtectedRoute>
              <AppLayout><BrokerPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><ProfilePage /></AppLayout>
            </ProtectedRoute>
          } />
          {/* Backward-compatible redirects */}
          <Route path="/broker-analysis" element={<Navigate to="/broker" replace />} />
          <Route path="/broksum" element={<Navigate to="/broker" replace />} />
          <Route path="/broker-intel" element={<Navigate to="/broker" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
