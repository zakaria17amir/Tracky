import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../ui/States";

/**
 * Redirect already-authenticated users away from login/register.
 */
export default function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}
