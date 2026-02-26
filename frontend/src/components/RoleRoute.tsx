import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HIERARCHY: Record<string, string[]> = {
  super_admin: ["super_admin", "captain", "crew"],
  captain: ["captain"],
  crew: ["crew"],
};

export default function RoleRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role: string;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // super_admin can access everything
  if (user.role === "super_admin") return children;

  // Check if user's role is allowed for this route's required role
  const allowedRoles = ROLE_HIERARCHY[role] || [role];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/items" replace />;
  }

  return children;
}