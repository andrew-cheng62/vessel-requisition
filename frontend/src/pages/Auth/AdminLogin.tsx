import { useState } from "react";
import api from "../../api/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
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
      setError("Incorrect username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">

        <div className="flex flex-col items-center mb-8 gap-3">
          <Logo size={40} />
          <p className="text-slate-500 text-xs tracking-widest uppercase">Admin access</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />
            <Input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-950 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
