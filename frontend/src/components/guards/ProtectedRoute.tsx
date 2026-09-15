import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../ui/States";

/**
 * Gate for authenticated users. NOTE: this is a UX convenience only — all
 * real authorization is enforced by the API.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingState label="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
