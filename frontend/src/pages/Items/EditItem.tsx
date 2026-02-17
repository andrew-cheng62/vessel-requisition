import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { fetchCompanies, fetchCategories } from "../../api/api";
import type { Item, Company, Category } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import toast from "react-hot-toast";


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
  const [imageDeleted, setImageDeleted] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* LOAD COMPANIES AND CATEGORIES */
  useEffect(() => {
    fetchCompanies({ role: "manufacturer" }).then(setManufacturers);
    fetchCompanies({ role: "supplier" }).then(setSuppliers);
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

      toast.success("Item saved successfully");
      setTimeout(() => navigate(`/items/${id}`), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save item");
    }
  };

  /* DELETE IMAGE */
  const deleteImage = async () => {
    if (!confirm("Delete item image?")) return;

    await api.delete(`/items/${id}/image`);

    setItem(prev => prev ? { ...prev, image_path: null } : prev);
    setImageDeleted(true);
    toast.success("Image deleted successfully");
};


  if (!item) return <p>Loading...</p>;

  return (
    <PageContainer title="Edit Item">

      <FormLayout onSubmit={handleSave}>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

        <FormField label="Edit Category">
          <Select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Edit Name">
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </FormField>

        <FormField label="Edit Description">
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </FormField>

        <FormField label="Edit Catalog Nr">
          <Input value={catalogueNr} onChange={e => setCatalogueNr(e.target.value)} />
        </FormField>

        <FormField label="Edit Unit">
          <Input value={unit} onChange={e => setUnit(e.target.value)} required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
        <FormField label="Edit Manufacturer">
          <Select
            value={manufacturerId}
            onChange={e => setManufacturerId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select manufacturer</option>
            {manufacturers.map(m => (
              <option key={m.id} value={m.id}>{m.name}
            </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Edit Supplier">
          <Select
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
          </Select>
        </FormField>
        </div>

      {/* IMAGE PREVIEW */}
      {item.image_path && !imageDeleted && (
        <div>
          <img
            src={`http://localhost:8000/${item.image_path}`}
            className="w-40 mb-2 rounded"
          />
          <Button
            variant="delete"
            type="button"
            onClick={deleteImage}
          >
            Delete image
          </Button>
        </div>
      )}

      <div className="form-actions space-y-6">

      {(!item.image_path || imageDeleted) && (
        <ImageUpload
          file={file}
          onChange={setFile}
          disabled={!!item.image_path && !imageDeleted}
        />
      )}

        <Button variant="ghost" type="submit">
          Save
        </Button>{" "}

        <Button
          variant="delete"
          type="button"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>

      </div>

    </FormLayout>
    </PageContainer>
  );
}
