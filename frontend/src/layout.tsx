import { Outlet, useLocation, Link, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Button from "./components/ui/Button";

export default function Layout() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const { user, vesselName, logout, isCaptain, isSuperAdmin } = useAuth();

  if (isAuthPage) return <div><main><Outlet /></main></div>;

  const navCls = "text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors";
  const activeCls = "text-sm font-medium text-sky-600 border-b-2 border-sky-600 pb-0.5";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 grid grid-cols-3 items-center">

          {/* LEFT — nav links */}
          <div className="flex items-center gap-6">
            <Link to="/items" className="flex items-center gap-2 font-bold text-slate-800 text-base shrink-0">
              <span>⚓</span>
              <span>VesselOps</span>
            </Link>

            {!isSuperAdmin && (
              <>
                <NavLink to="/items" className={({ isActive }) => isActive ? activeCls : navCls}>Items</NavLink>
                <NavLink to="/requisitions" className={({ isActive }) => isActive ? activeCls : navCls}>Requisitions</NavLink>
                <NavLink to="/companies" className={({ isActive }) => isActive ? activeCls : navCls}>Companies</NavLink>
                {isCaptain && (
                  <>
                    <NavLink to="/crew" className={({ isActive }) => isActive ? activeCls : navCls}>Crew</NavLink>
                    <NavLink to="/vessel/settings" className={({ isActive }) => isActive ? activeCls : navCls}>Vessel</NavLink>
                  </>
                )}
              </>
            )}

            {isSuperAdmin && (
              <NavLink to="/admin/vessels" className={({ isActive }) => isActive ? activeCls : navCls}>
                Vessels
              </NavLink>
            )}
          </div>

          {/* CENTER — vessel name */}
          <div className="flex justify-center">
            {vesselName && (
              <div className="flex items-center gap-2 px-4 py-1 bg-slate-100 rounded-full">
                <span className="text-slate-400 text-sm">🚢</span>
                <span className="text-sm font-semibold text-slate-700 tracking-wide">
                  {vesselName}
                </span>
              </div>
            )}
            {isSuperAdmin && (
              <div className="flex items-center gap-2 px-4 py-1 bg-purple-100 rounded-full">
                <span className="text-sm font-semibold text-purple-700">⚙ Super Admin</span>
              </div>
            )}
          </div>

          {/* RIGHT — user info + sign out */}
          <div className="flex items-center justify-end gap-4">
            {user && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{user.full_name}</div>
                <div className="text-xs text-gray-400 capitalize">{user.role.replace("_", " ")}</div>
              </div>
            )}
            <Button variant="ghost" onClick={logout} className="text-sm">
              Sign out
            </Button>
          </div>

        </div>
      </nav>

      <main><Outlet /></main>
    </div>
  );
}