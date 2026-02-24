import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { fetchCompanies, fetchItems } from "../../api/api";
import type { Company, Item, RequisitionLine } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import toast from "react-hot-toast";


export default function EditRequisition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<RequisitionLine[]>([]);
  const [status, setStatus] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /* LOAD DATA */
  useEffect(() => {
    fetchCompanies().then(res => setCompanies(res.items));
    fetchItems().then(res => setItems(res.items));

    api.get(`/requisitions/${id}`).then(res => {
      const r = res.data;

      if (r.status !== "draft") return <p>Editing not allowed</p>;

      setStatus(r.status);
      setSupplierId(r.supplier?.id ?? "");
      setNotes(r.notes || "");

      setLines(
        r.items.map((l: any) => ({
          item_id: l.item.id,
          name: l.item.name,
          unit: l.item.unit,
          quantity: l.quantity,
        }))
      );
    });
  }, [id, navigate]);

  /* ADD ITEM */
  const addItem = (item: Item) => {
    if (lines.some(l => l.item_id === item.id)) return;

    setLines([
      ...lines,
      {
        item_id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: 1,
      },
    ]);
  };

  /* UPDATE QTY */
  const updateQty = (index: number, qty: number) => {
    const copy = [...lines];
    copy[index].quantity = qty;
    setLines(copy);
  };

  /* REMOVE */
  const removeLine = (item_id: number) => {
    setLines(lines.filter(l => l.item_id !== item_id));
  };

  /* SAVE */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Supplier required");
      return;
    }

    try {
      await api.put(`/requisitions/${id}`, {
        supplier_id: supplierId,
        notes: notes || undefined,
        items: lines.map(l => ({
          item_id: l.item_id,
          quantity: l.quantity,
        })),
      });
      toast.success("Requisition saved");
      setTimeout(() => navigate(`/requisitions/${id}`), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save requisition");
    }
  };

  if (!status) return <p>Loading...</p>;

return (
  <PageContainer title={`Edit Requisition #${id}`}>

    <FormLayout onSubmit={handleSave}>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ===== BASIC INFO ===== */}
      <div className="grid grid-cols-2 gap-6">

        <FormField label="Supplier">
          <Select
            value={supplierId}
            onChange={e =>
              setSupplierId(e.target.value ? Number(e.target.value) : "")
            }
            required
          >
            <option value="">Select supplier</option>
            {companies
              .filter(c => c.is_supplier)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </FormField>

        <FormField label="Notes">
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </FormField>

      </div>

      {/* ===== ITEMS SECTION ===== */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Items</h2>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/items?requisition_id=${id}`)}
          >
            Add items
          </Button>
        </div>

        {lines.length === 0 ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">
            No items added yet
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 w-24">Unit</th>
                  <th className="px-4 py-3 w-32">Quantity</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.item_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {l.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {l.unit}
                    </td>

                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={e =>
                          updateQty(i, Number(e.target.value))
                        }
                        className="w-24"
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="delete"
                        type="button"
                        onClick={() => removeLine(l.item_id)}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="mt-8 flex justify-end gap-3">

        <Button
          type="submit"
          variant="ghost"
        >
          Save changes
        </Button>

        <Button
          type="button"
          variant="delete"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>

      </div>

    </FormLayout>
  </PageContainer>
);
}