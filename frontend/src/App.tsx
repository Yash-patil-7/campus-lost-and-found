import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { SearchPage } from './pages/SearchPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminHandoversPage } from './pages/AdminHandoversPage';
import { AdminMatchesPage } from './pages/AdminMatchesPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { NotificationsPage } from './pages/NotificationsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs animate-pulse">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/student/dashboard" replace />;
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {user && <Sidebar />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-lost"
              element={
                <ProtectedRoute>
                  <ReportLostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-found"
              element={
                <ProtectedRoute>
                  <ReportFoundPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/handovers"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminHandoversPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/matches"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminMatchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
