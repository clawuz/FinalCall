import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './lib/auth';
import LoginPage from './pages/LoginPage';
import AwardsPage from './pages/AwardsPage';
import ArticlesPage from './pages/ArticlesPage';
import TipsPage from './pages/TipsPage';
import NotificationsPage from './pages/NotificationsPage';
import StatsPage from './pages/StatsPage';
import TopNav from './components/TopNav';

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <>
              <TopNav />
              <Routes>
                <Route path="/" element={<Navigate to="/awards" replace />} />
                <Route path="/awards" element={<AwardsPage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/tips" element={<TipsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/stats" element={<StatsPage />} />
              </Routes>
            </>
          </AuthGuard>
        }
      />
    </Routes>
  );
}
