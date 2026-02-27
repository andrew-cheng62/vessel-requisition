import { useState } from "react";
import { Outlet, useLocation, Link, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Button from "./components/ui/Button";
import ChangePasswordModal from "./components/ChangePasswordModal";

export default function Layout() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const { user, vesselName, logout, isCaptain, isSuperAdmin } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (isAuthPage) return <div><main><Outlet /></main></div>;

  const navCls = "text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer";
  const activeCls = "text-sm font-medium text-sky-600 border-b-2 border-sky-600 pb-0.5 cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* LEFT — logo + nav links */}
          <div className="flex items-center gap-6">
            <Link
              to={isSuperAdmin ? "/admin/vessels" : "/items"}
              className="flex items-center gap-2 font-bold text-slate-800 text-base shrink-0 cursor-pointer"
            >
              <span>⚓</span>
              <span>VesselOps</span>
            </Link>

            {isSuperAdmin && (
              <>
                <NavLink to="/admin/vessels" className={({ isActive }) => isActive ? activeCls : navCls}>Vessels</NavLink>
                <NavLink to="/items" className={({ isActive }) => isActive ? activeCls : navCls}>Items</NavLink>
                <NavLink to="/companies" className={({ isActive }) => isActive ? activeCls : navCls}>Companies</NavLink>
                <NavLink to="/requisitions" className={({ isActive }) => isActive ? activeCls : navCls}>Requisitions</NavLink>
              </>
            )}

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
          </div>

          {/* RIGHT — user info + change password + sign out */}
          <div className="flex items-center gap-4">
            {user && (
              <button
                onClick={() => setShowChangePassword(true)}
                className="text-right hover:opacity-75 transition-opacity cursor-pointer"
                title="Click to change password"
              >
                <div className="text-sm font-medium text-gray-800">{user.full_name}</div>
                <div className="text-xs text-gray-400 capitalize">{user.role.replace("_", " ")}</div>
              </button>
            )}
            <Button variant="ghost" onClick={logout} className="text-sm">
              Sign out
            </Button>
          </div>

        </div>
      </nav>

      {/* VESSEL CONTEXT BAR */}
      {(vesselName || isSuperAdmin) && (
        <div className="bg-slate-700 text-white">
          <div className="max-w-7xl mx-auto px-6 h-8 flex items-center gap-2">
            {vesselName && (
              <>
                <span className="text-slate-400 text-xs">🚢</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-slate-200">
                  {vesselName}
                </span>
              </>
            )}
            {isSuperAdmin && (
              <>
                <span className="text-xs">⚙</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-purple-300">
                  Super Admin
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <main><Outlet /></main>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
