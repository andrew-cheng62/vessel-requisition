import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerVessel } from "../../api/api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

const VESSEL_TYPES = ["Cargo", "Tanker", "Passenger", "Fishing", "Tug", "Yacht", "Research", "Other"];

export default function RegisterVessel() {
  const navigate = useNavigate();

  // Vessel fields
  const [vesselName, setVesselName] = useState("");
  const [imoNumber, setImoNumber] = useState("");
  const [email, setEmail] = useState("");
  const [flag, setFlag] = useState("");
  const [vesselType, setVesselType] = useState("");

  // Captain account fields
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await registerVessel({
        name: vesselName,
        imo_number: imoNumber || undefined,
        email: email || undefined,
        flag: flag || undefined,
        vessel_type: vesselType || undefined,
        captain_username: username,
        captain_full_name: fullName,
        captain_password: password,
      });

      toast.success("Vessel registered! Please log in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">⚓</span>
            <h1 className="text-2xl font-bold">Register Your Vessel</h1>
          </div>
          <p className="text-slate-300 text-sm">
            Set up your vessel and captain account to get started.
          </p>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s as 1 | 2)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition ${
                  step === s
                    ? "bg-white text-slate-800"
                    : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? "bg-slate-800 text-white" : "bg-slate-400 text-white"
                }`}>{s}</span>
                {s === 1 ? "Vessel" : "Captain"}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vessel Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. MV Northern Star"
                  value={vesselName}
                  onChange={e => setVesselName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMO Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. 9876543"
                  value={imoNumber}
                  onChange={e => setImoNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vessel e-mail <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. f.drake@pirates.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flag</label>
                  <Input
                    placeholder="e.g. Norway"
                    value={flag}
                    onChange={e => setFlag(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={vesselType}
                    onChange={e => setVesselType(e.target.value)}
                  >
                    <option value="">Select type</option>
                    {VESSEL_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                className="w-full mt-2"
                disabled={!vesselName}
                onClick={() => setStep(2)}
              >
                Next: Captain Account →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Captain's full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Login username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={loading || !username || !fullName || !password || password !== confirmPassword}
                >
                  {loading ? "Registering..." : "⚓ Register Vessel"}
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-500 pt-2">
            Already registered?{" "}
            <Link to="/login" className="text-sky-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
