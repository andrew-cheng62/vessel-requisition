import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

type VesselOption = { id: number; name: string };

export default function Login() {
  const [vessels, setVessels] = useState<VesselOption[]>([]);
  const [vesselId, setVesselId] = useState<number | "">("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Load vessel list on mount (public endpoint)
  useEffect(() => {
    api.get("/vessels/public")
      .then(res => setVessels(res.data))
      .catch(() => setError("Could not load vessel list"));
  }, []);

  const selectedVessel = vessels.find(v => v.id === vesselId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/login", {
        username,
        password,
        vessel_id: vesselId || null,
      });
      login(res.data.access_token, res.data.vessel_name);
    } catch {
      setError("Invalid vessel, username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚓</div>
          <h1 className="text-3xl font-bold text-white">VesselOps</h1>
          <p className="text-slate-400 text-sm mt-1">Vessel Requisition Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl px-8 py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1: Vessel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vessel
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={vesselId}
                onChange={e => {
                  setVesselId(e.target.value ? Number(e.target.value) : "");
                  setUsername("");
                  setPassword("");
                  setError("");
                }}
                required
              >
                <option value="">— Select your vessel —</option>
                {vessels.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
                <option value="">─────────────</option>
                <option value="__admin__" disabled style={{ color: "#aaa" }}>
                  Super Admin (use admin login below)
                </option>
              </select>
            </div>

            {/* Steps 2+3: only shown after vessel selected */}
            {vesselId !== "" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                    <span className="ml-1 text-xs text-gray-400">
                      on {selectedVessel?.name}
                    </span>
                  </label>
                  <Input
                    placeholder="Your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <Input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button
              variant="primary"
              type="submit"
              className="w-full"
              disabled={loading || vesselId === ""}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Super admin login — separate minimal section */}
          <details className="mt-5 text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-gray-600 select-none">
              Admin login
            </summary>
            <form
              className="mt-3 space-y-3"
              onSubmit={async e => {
                e.preventDefault();
                setError("");
                setLoading(true);
                try {
                  const res = await api.post("/login", {
                    username,
                    password,
                    vessel_id: null,
                  });
                  login(res.data.access_token, undefined);
                } catch {
                  setError("Invalid credentials");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Input
                placeholder="Admin username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="text-sm"
              />
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="text-sm"
              />
              <Button variant="ghost" type="submit" className="w-full text-sm" disabled={loading}>
                Admin sign in
              </Button>
            </form>
          </details>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">New vessel?</p>
            <Link
              to="/register"
              className="mt-1 inline-block text-sm font-medium text-sky-600 hover:underline"
            >
              Register your vessel →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}