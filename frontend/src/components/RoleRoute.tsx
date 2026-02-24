import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role: string;
}) {
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return <Navigate to="/items" replace />;
  }

  return children;
}