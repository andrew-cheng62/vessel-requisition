import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { fetchCompanies, fetchCategories } from "../../api/api";
import type { Item, Company, Category } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { FormLayout } from "../../components/ui/FormLayout";

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catalogueNr, setCatalogueNr] = useState("");
  const [unit, setUnit] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [manufacturerId, setManufacturerId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* LOAD COMPANIES AND CATEGORIES */
  useEffect(() => {
    fetchCompanies({ is_manufacturer: true }).then(setManufacturers);
    fetchCompanies({ is_supplier: true }).then(setSuppliers);
    fetchCategories().then(setCategories);
  }, []);

  /* LOAD ITEM */
  useEffect(() => {
    api.get(`/items/${id}`).then(res => {
      const data = res.data;
      setItem(data);
      setName(data.name);
      setDescription(data.description || "");
      setCatalogueNr(data.catalogue_nr || "");
      setUnit(data.unit);
      setCategoryId(data.category?.id ?? "");
      setManufacturerId(data.manufacturer?.id ?? "");
      setSupplierId(data.supplier?.id ?? "");
    });
  }, [id]);

  /* SAVE ITEM */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.put(`/items/${id}`, {
        name,
        description: description || undefined,
        catalogue_nr: catalogueNr || undefined,
        unit,
        category_id: categoryId || undefined,
        manufacturer_id: manufacturerId || undefined,
        supplier_id: supplierId || undefined
      });

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/items/${id}/image`, formData);
      }

      setMessage("Item saved successfully");
      navigate(`/items/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save item");
    }
  };

  /* DELETE IMAGE */
  const deleteImage = async () => {
    if (!confirm("Delete item image?")) return;

    await api.delete(`/items/${id}/image`);
    setItem(prev => prev ? { ...prev, image_path: null } : prev);
  };

  if (!item) return <p>Loading...</p>;

  return (
    <FormLayout onSubmit={handleSave}>
      <div className="flex justify-between items-center mb-6"> 
        <h1 className="text-2x1 font-semibold">Edit Item</h1>
      </div>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <Input value={name} onChange={e => setName(e.target.value)} required />
      <Input value={description} onChange={e => setDescription(e.target.value)} />
      <Input value={catalogueNr} onChange={e => setCatalogueNr(e.target.value)} />
      <Input value={unit} onChange={e => setUnit(e.target.value)} required />
      <select
        value={categoryId}
        onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Select category</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={manufacturerId}
        onChange={e => setManufacturerId(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Select manufacturer</option>
        {manufacturers.map(m => (
          <option key={m.id} value={m.id}>{m.name}
        </option>
        ))}
      </select>

      {/* Supplier */}
      <select
        value={supplierId}
        onChange={e =>
          setSupplierId(e.target.value ? Number(e.target.value) : "")
        }
      >
        <option value="">Select supplier</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}
        </option>
        ))}
      </select>

      {/* IMAGE PREVIEW */}
      {item.image_path && (
        <div>
          <img
            src={`http://localhost:8000/${item.image_path}`}
            style={{ width: 150, display: "block", marginBottom: 8 }}
          />
          <Button variant="primary" onClick={deleteImage}>
            Delete image
          </Button>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />

      <Button type="submit">Save</Button>
    </FormLayout>
  );
}
