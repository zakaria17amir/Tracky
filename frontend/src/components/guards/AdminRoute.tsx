import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../ui/States";

/**
 * Gate for admin-only pages. The API also enforces this server-side.
 */
export default function AdminRoute() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <LoadingState label="Checking permissions…" />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
