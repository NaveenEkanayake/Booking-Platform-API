import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken, Layout, ErrorBoundary } from './shared';
import { AuthGuard, LoginPage } from './auth';
import { DashboardPage } from './dashboard';
import { ServicesPage } from './services';
import { BookingsPage } from './bookings';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Layout>
        <ErrorBoundary>{children}</ErrorBoundary>
      </Layout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={getToken() ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/services" element={<ProtectedLayout><ServicesPage /></ProtectedLayout>} />
        <Route path="/bookings" element={<ProtectedLayout><BookingsPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
