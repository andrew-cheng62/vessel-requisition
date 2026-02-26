import { useEffect, useState } from "react";
import { fetchCrew, createCrew, deactivateCrew, updateCrew } from "../../api/api";
import type { User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import PageContainer from "../../components/layout/PageContainer";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import toast from "react-hot-toast";

type CrewForm = {
  username: string;
  full_name: string;
  password: string;
  role: "crew" | "captain";
};

const EMPTY_FORM: CrewForm = { username: "", full_name: "", password: "", role: "crew" };

export default function CrewManagement() {
  const { user: me } = useAuth();
  const [crew, setCrew] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CrewForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchCrew()
      .then(setCrew)
      .catch(() => toast.error("Failed to load crew"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await createCrew(form);
      toast.success(`${form.role === "captain" ? "Captain" : "Crew member"} added`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add crew member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Deactivate ${user.full_name || user.username}?`)) return;
    try {
      await deactivateCrew(user.id);
      toast.success("User deactivated");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to deactivate");
    }
  };

  const handleReactivate = async (user: User) => {
    try {
      await updateCrew(user.id, { is_active: true });
      toast.success("User reactivated");
      load();
    } catch {
      toast.error("Failed to reactivate");
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      captain: "bg-amber-100 text-amber-800",
      crew: "bg-blue-100 text-blue-700",
      super_admin: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[role] || "bg-gray-100"}`}>
        {role.replace("_", " ")}
      </span>
    );
  };

  return (
    <PageContainer
      title="Crew Management"
      actions={
        <Button variant="primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? "Cancel" : "+ Add Crew Member"}
        </Button>
      }
    >

      {/* Add crew form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
        >
          <h3 className="font-semibold text-gray-800">New Crew Member</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <Input
                placeholder="Full name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
              <Input
                placeholder="Login username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <Input
                type="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as "crew" | "captain" }))}
              >
                <option value="crew">Crew</option>
                <option value="captain">Captain</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Adding..." : "Add Member"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {crew.map(u => (
              <tr key={u.id} className={`border-t border-gray-100 ${!u.is_active ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.full_name || "—"}
                  {u.id === me?.sub && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.username}</td>
                <td className="px-4 py-3">{roleBadge(u.role)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.is_active ? "text-green-600" : "text-red-500"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me?.sub && (
                    u.is_active ? (
                      <Button variant="delete" onClick={() => handleDeactivate(u)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => handleReactivate(u)}>
                        Reactivate
                      </Button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {!loading && crew.length === 0 && (
        <p className="text-gray-500 text-sm mt-4">No crew members yet.</p>
      )}
    </PageContainer>
  );
}
