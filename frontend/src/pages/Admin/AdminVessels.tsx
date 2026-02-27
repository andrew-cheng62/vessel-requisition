import { useEffect, useState } from "react";
import { fetchVessels } from "../../api/api";
import api from "../../api/api";
import type { Vessel } from "../../types";
import PageContainer from "../../components/layout/PageContainer";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function AdminVessels() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchVessels()
      .then(setVessels)
      .catch(() => toast.error("Failed to load vessels"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (vessel: Vessel) => {
    const action = vessel.is_active ? "deactivate" : "reactivate";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${vessel.name}"?`)) return;

    try {
      if (vessel.is_active) {
        await api.delete(`/vessels/${vessel.id}`);
        toast.success("Vessel deactivated");
      } else {
        await api.put(`/vessels/${vessel.id}`, { is_active: true });
        toast.success("Vessel reactivated");
      }
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed");
    }
  };

  const statCell = (n: number | undefined) => (
    <span className="font-mono text-sm">{n ?? 0}</span>
  );

  return (
    <PageContainer title="All Vessels">
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Vessels", value: vessels.length },
          { label: "Active", value: vessels.filter(v => v.is_active).length },
          { label: "Inactive", value: vessels.filter(v => !v.is_active).length },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Vessel</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">IMO</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">E-mail</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type / Flag</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Users</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Items</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Reqs</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vessels.map(v => (
              <tr key={v.id} className={`border-t border-gray-100 hover:bg-gray-50 ${!v.is_active ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{v.imo_number || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{v.email || "—"}</td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {[v.vessel_type, v.flag].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-4 py-3 text-center">{statCell(v.user_count)}</td>
                <td className="px-4 py-3 text-center">{statCell(v.item_count)}</td>
                <td className="px-4 py-3 text-center">{statCell(v.requisition_count)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${v.is_active ? "text-green-600" : "text-red-500"}`}>
                    {v.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant={v.is_active ? "delete" : "ghost"}
                    onClick={() => handleToggle(v)}
                  >
                    {v.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {!loading && vessels.length === 0 && (
        <p className="text-gray-500 text-sm mt-4">No vessels registered yet.</p>
      )}
    </PageContainer>
  );
}
