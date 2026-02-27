import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

interface TokenPayload {
  sub: string;
  role: "super_admin" | "captain" | "crew";
  full_name: string;
  vessel_id: number | null;
  exp: number;
}

interface AuthContextType {
  user: TokenPayload | null;
  vesselName: string | null;
  loading: boolean;
  login: (token: string, vesselName?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isCaptain: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [vesselName, setVesselName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);  // true until we've checked localStorage
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("vessel_name");
    setUser(null);
    setVesselName(null);
    navigate("/login");
  };

  const login = (token: string, vName?: string) => {
    localStorage.setItem("token", token);
    if (vName) localStorage.setItem("vessel_name", vName);
    const decoded = jwtDecode<TokenPayload>(token);
    setUser(decoded);
    setVesselName(vName || null);
    if (decoded.role === "super_admin") {
      navigate("/admin/vessels");
    } else {
      navigate("/items");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedVesselName = localStorage.getItem("vessel_name");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (decoded.exp * 1000 < Date.now()) {
        logout();
      } else {
        setUser(decoded);
        setVesselName(storedVesselName);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      vesselName,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isCaptain: user?.role === "captain" || user?.role === "super_admin",
      isSuperAdmin: user?.role === "super_admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
