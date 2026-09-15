import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./components/guards/GuestRoute";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import AdminRoute from "./components/guards/AdminRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardViewPage from "./pages/DashboardViewPage";
import DashboardListPage from "./pages/DashboardListPage";
import MetricsPage from "./pages/MetricsPage";
import LogEntryPage from "./pages/LogEntryPage";
import EntryHistoryPage from "./pages/EntryHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard view lives at "/" and selects a dashboard via ?d=ID,
              so the path stays "/" (keeping the Dashboard nav item active). */}
          <Route path="/" element={<DashboardViewPage />} />
          <Route path="/dashboards" element={<DashboardListPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/log" element={<LogEntryPage />} />
          <Route path="/metrics/:id/history" element={<EntryHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin-only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
