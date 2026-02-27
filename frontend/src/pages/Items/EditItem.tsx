import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { fetchCompanies, fetchCategories } from "../../api/api";
import type { Item, Company, Category, Tag } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import TagSelector from "../../components/ui/TagSelector";
import toast from "react-hot-toast";

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [descShort, setDescShort] = useState("");
  const [descLong, setDescLong] = useState("");
  const [catalogueNr, setCatalogueNr] = useState("");
  const [unit, setUnit] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [manufacturerId, setManufacturerId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [imageDeleted, setImageDeleted] = useState(false);

  useEffect(() => {
    fetchCompanies({ role: "manufacturer" }).then(res => setManufacturers(res.items));
    fetchCompanies({ role: "supplier" }).then(res => setSuppliers(res.items));
    fetchCategories().then(setCategories);
    api.get("/tags").then(res => setAllTags(res.data));
  }, []);

  useEffect(() => {
    api.get(`/items/${id}`).then(res => {
      const data = res.data;
      setItem(data);
      setName(data.name);
      setDescShort(data.desc_short || "");
      setDescLong(data.desc_long || "");
      setCatalogueNr(data.catalogue_nr || "");
      setUnit(data.unit);
      setCategoryId(data.category?.id ?? "");
      setManufacturerId(data.manufacturer?.id ?? "");
      setSupplierId(data.supplier?.id ?? "");
      setSelectedTagIds(data.tags?.map((t: Tag) => t.id) ?? []);
    });
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/items/${id}`, {
        name,
        desc_short: descShort || undefined,
        desc_long: descLong || undefined,
        catalogue_nr: catalogueNr || undefined,
        unit,
        category_id: categoryId || undefined,
        manufacturer_id: manufacturerId || undefined,
        supplier_id: supplierId || undefined,
        tag_ids: selectedTagIds,
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

  const deleteImage = async () => {
    if (!confirm("Delete item image?")) return;
    await api.delete(`/items/${id}/image`);
    setItem(prev => prev ? { ...prev, image_path: null } : prev);
    setImageDeleted(true);
    toast.success("Image deleted");
  };

  if (!item) return <p>Loading...</p>;

  return (
    <PageContainer title="Edit Item">
      <FormLayout onSubmit={handleSave}>

        <FormField label="Category">
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>

        <FormField label="Name">
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </FormField>

        <FormField label="Short description">
          <Input value={descShort} onChange={e => setDescShort(e.target.value)} />
        </FormField>

        <FormField label="Full description">
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            rows={3}
            value={descLong}
            onChange={e => setDescLong(e.target.value)}
          />
        </FormField>

        <FormField label="Catalogue Nr">
          <Input value={catalogueNr} onChange={e => setCatalogueNr(e.target.value)} />
        </FormField>

        <FormField label="Unit">
          <Input value={unit} onChange={e => setUnit(e.target.value)} required />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Manufacturer">
            <Select value={manufacturerId} onChange={e => setManufacturerId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Select manufacturer</option>
              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </FormField>

          <FormField label="Supplier">
            <Select value={supplierId} onChange={e => setSupplierId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
        </div>

        <FormField label="Tags">
          <TagSelector
            allTags={allTags}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </FormField>

        {item.image_path && !imageDeleted && (
          <div>
            <img src={`http://localhost:8000/${item.image_path}`} className="w-40 mb-2 rounded" alt="" />
            <Button variant="delete" type="button" onClick={deleteImage}>Delete image</Button>
          </div>
        )}

        <div className="space-y-4">
          {(!item.image_path || imageDeleted) && (
            <ImageUpload file={file} onChange={setFile} disabled={!!item.image_path && !imageDeleted} />
          )}
          <div className="flex gap-3">
            <Button variant="primary" type="submit">Save</Button>
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </div>

      </FormLayout>
    </PageContainer>
  );
}
