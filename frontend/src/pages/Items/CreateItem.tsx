import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { fetchCompanies, fetchCategories, fetchTags } from "../../api/api";
import type { Company, Category, Tag } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import TagSelector from "../../components/ui/TagSelector";
import toast from "react-hot-toast";

export default function CreateItem() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [descShort, setDescShort] = useState("");
  const [descLong, setDescLong] = useState("");
  const [catalogueNr, setCatalogueNr] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [manufacturerId, setManufacturerId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCompanies({ role: "manufacturer" }).then(res => setManufacturers(res.items));
    fetchCompanies({ role: "supplier" }).then(res => setSuppliers(res.items));
    fetchCategories().then(setCategories);
    fetchTags().then(setAllTags);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/items/", {
        name,
        desc_short: descShort || undefined,
        desc_long: descLong || undefined,
        catalogue_nr: catalogueNr || undefined,
        unit,
        category_id: categoryId || undefined,
        manufacturer_id: manufacturerId || undefined,
        supplier_id: supplierId || undefined,
        tag_ids: selectedTagIds,
        is_active: true,
      });

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/items/${res.data.id}/image`, formData);
      }

      toast.success("Item created");
      setTimeout(() => navigate(`/items/${res.data.id}`), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to create item");
    }
  };

  return (
    <PageContainer title="Add New Item">
      <FormLayout onSubmit={handleSubmit}>

        <FormField label="Category">
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")} required>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>

        <FormField label="Name">
          <Input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} required />
        </FormField>

        <FormField label="Short description">
          <Input placeholder="Brief summary" value={descShort} onChange={e => setDescShort(e.target.value)} />
        </FormField>

        <FormField label="Full description">
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            rows={3}
            placeholder="Detailed description"
            value={descLong}
            onChange={e => setDescLong(e.target.value)}
          />
        </FormField>

        <FormField label="Catalogue Nr">
          <Input placeholder="e.g. MAN-4521-B" value={catalogueNr} onChange={e => setCatalogueNr(e.target.value)} />
        </FormField>

        <FormField label="Unit">
          <Input placeholder="e.g. pcs, L, kg" value={unit} onChange={e => setUnit(e.target.value)} required />
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
          <TagSelector allTags={allTags} selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
        </FormField>

        <div className="space-y-4">
          <ImageUpload file={file} onChange={setFile} />
          <div className="flex gap-3">
            <Button variant="primary" type="submit">Save</Button>
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </div>

      </FormLayout>
    </PageContainer>
  );
}
