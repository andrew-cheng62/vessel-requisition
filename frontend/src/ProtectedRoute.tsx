import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const isAuth = Boolean(localStorage.getItem("token"));

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
