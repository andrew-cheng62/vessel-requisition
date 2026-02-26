import { useEffect, useState } from "react";
import { fetchVessel } from "../../api/api";
import api from "../../api/api";
import type { Vessel } from "../../types";
import { useAuth } from "../../context/AuthContext";
import PageContainer from "../../components/layout/PageContainer";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import toast from "react-hot-toast";

const VESSEL_TYPES = ["Cargo", "Tanker", "Passenger", "Fishing", "Tug", "Yacht", "Research", "Other"];

export default function VesselSettings() {
  const { user } = useAuth();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [name, setName] = useState("");
  const [imoNumber, setImoNumber] = useState("");
  const [flag, setFlag] = useState("");
  const [vesselType, setVesselType] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.vessel_id) return;
    fetchVessel(user.vessel_id).then(v => {
      setVessel(v);
      setName(v.name);
      setImoNumber(v.imo_number || "");
      setFlag(v.flag || "");
      setVesselType(v.vessel_type || "");
    });
  }, [user?.vessel_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.vessel_id) return;
    setSaving(true);
    try {
      await api.put(`/vessels/${user.vessel_id}`, {
        name,
        imo_number: imoNumber || null,
        flag: flag || null,
        vessel_type: vesselType || null,
      });
      toast.success("Vessel settings saved");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!vessel) return <PageContainer title="Vessel Settings"><p className="text-gray-500">Loading...</p></PageContainer>;

  return (
    <PageContainer title="Vessel Settings">
      <div className="max-w-lg">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Users", value: vessel.user_count ?? 0 },
            { label: "Items", value: vessel.item_count ?? 0 },
            { label: "Requisitions", value: vessel.requisition_count ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <FormLayout onSubmit={handleSave}>
          <FormField label="Vessel Name">
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </FormField>

          <FormField label="IMO Number">
            <Input
              placeholder="e.g. 9876543"
              value={imoNumber}
              onChange={e => setImoNumber(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Flag">
              <Input placeholder="e.g. Norway" value={flag} onChange={e => setFlag(e.target.value)} />
            </FormField>

            <FormField label="Vessel Type">
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={vesselType}
                onChange={e => setVesselType(e.target.value)}
              >
                <option value="">Select type</option>
                {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          </div>

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </FormLayout>
      </div>
    </PageContainer>
  );
}
