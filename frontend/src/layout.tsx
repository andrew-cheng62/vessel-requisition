import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Button from "./components/ui/Button";

export default function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      {!isLoginPage &&
        <nav className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
  
          {/* LEFT SIDE */}
          <div className="flex gap-6">
            <Link to="/items">Items</Link>
            <Link to="/requisitions">Requisitions</Link>
            <Link to="/companies">Companies</Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.full_name}
              </span>
            )}

            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        </nav>
      }
        <main>
          <Outlet />
        </main>
     </div>
  );
}
