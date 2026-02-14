import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { fetchCompanies, fetchItems } from "../../api/api";
import type { Company, Item, RequisitionLine } from "../../types";

export default function CreateRequisition() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialItemId = searchParams.get("item_id");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [supplierId, setSupplierId] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<RequisitionLine[]>([]);

  const [error, setError] = useState<string | null>(null);

  /* LOAD DATA */

  useEffect(() => {
    fetchCompanies({ is_supplier: true }).then(setCompanies);
    fetchItems().then(setItems);
  }, []);


  useEffect(() => {
  if (!initialItemId || items.length === 0) return;

  const item = items.find(i => i.id === Number(initialItemId));
  if (!item) return;

  setLines([{
    item_id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: 1,
  }]);
 }, [initialItemId, items]);

  /* LINE HANDLERS */
  const addLine = (item: Item) => {
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


  const updateLine = (index: number, field: keyof RequisitionLine, value: any) => {
    const copy = [...lines];
    copy[index] = { ...copy[index], [field]: value };
    setLines(copy);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  /* SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Please select supplier");
      return;
    }

    const validLines = lines.filter(
      l => l.item_id && l.quantity > 0
    );

    if (validLines.length === 0) {
      setError("Add at least one item");
      return;
    }

    try {
      const res = await api.post("/requisitions/", {
        supplier_id: supplierId,
        notes: notes || undefined,
        items: validLines.map(l => ({
          item_id: l.item_id,
          quantity: l.quantity,
        })),
      });

      navigate(`/requisitions/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create requisition");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>New Requisition</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* SUPPLIER */}
      <label>Supplier</label>
      <select
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
      </select>

      {/* NOTES */}
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        style={{ width: "100%", marginTop: 8 }}
      />

      <hr />

      {/* ITEMS */}
      <h3>Items</h3>

      {lines.map((line, index) => (
        <div key={line.item_id} style={{ display: "flex", gap: 8 }}>
          <strong>{line.name}</strong>
          <span>{line.unit}</span>

          <input
            type="number"
            min={1}
            value={line.quantity}
            onChange={e => {
              const copy = [...lines];
              copy[index].quantity = Number(e.target.value);
              setLines(copy);
            }}
            style={{ width: 80 }}
      />

      <button
        type="button"
        onClick={() =>
          setLines(lines.filter(l => l.item_id !== line.item_id))
        }
      >
       ✕
      </button>
    </div>
   ))}

   <hr />

   <button
     type="button"
     onClick={() => navigate("/items")}
   >
     ➕ Add more items
   </button>

      <hr />

      <button type="submit">Create Requisition</button>
    </form>
  );
}
