import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { fetchCompanies, fetchItems } from "../../api/api";
import type { Company, Item, RequisitionLine } from "../../types";


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

  /* LOAD DATA */
  useEffect(() => {
    fetchCompanies().then(setCompanies);
    fetchItems().then(setItems);

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

      navigate(`/requisitions/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save requisition");
    }
  };

  if (!status) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 900 }}>
      <h2>Edit Requisition #{id}</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* SUPPLIER */}
      <label>Supplier</label>
      <select
        value={supplierId}
        onChange={e => setSupplierId(Number(e.target.value))}
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
      </select>

      {/* NOTES */}
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes"
        style={{ width: "100%", marginTop: 8 }}
      />

      <hr />

      {/* ITEMS */}
      <h3>Items</h3>

      {lines.map((l, i) => (
        <div key={l.item_id} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <strong>{l.name}</strong>
          <span>{l.unit}</span>

          <input
            type="number"
            min={1}
            value={l.quantity}
            onChange={e => updateQty(i, Number(e.target.value))}
            style={{ width: 80 }}
          />

          <button type="button" onClick={() => removeLine(l.item_id)}>
            ✕
          </button>
        </div>
      ))}

      <hr />

      <button type="button" onClick={() => navigate(`/items?requisition_id=${id}`)}>
        ➕ Add more items
      </button>

      <button type="submit">Save changes</button>
    </form>
  );
}
