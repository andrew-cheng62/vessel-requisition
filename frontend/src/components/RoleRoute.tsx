import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role: string;
}) {
  const { user, isAuthenticated } = useAuth();

  // Still initializing — don't redirect yet
  if (!isAuthenticated && !user) return null;

  if (!user) return <Navigate to="/login" replace />;

  // super_admin can access everything
  if (user.role === "super_admin") return children;

  // captain can access captain and crew routes
  if (user.role === "captain" && (role === "captain" || role === "crew")) return children;

  // crew can only access crew routes
  if (user.role === "crew" && role === "crew") return children;

  // Not authorized
  return <Navigate to="/items" replace />;
}
