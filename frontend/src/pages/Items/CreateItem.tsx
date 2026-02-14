import { useEffect, useState } from "react";
import api, { fetchCompanies, fetchCategories } from "../../api/api";
import type { Company, Category } from "../../types";
import { useNavigate } from "react-router-dom"; 
import { FormLayout, FormField } from "../../components/ui/FormLayout";
import Input from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import Button from "../../components/ui/Button";
import PageContainer from "../../components/layout/PageContainer";
import Select from "../../components/ui/Select";

export default function CreateItem() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catalogueNr, setCatalogueNr] = useState("");
  const [unit, setUnit] = useState("");
  const [manufacturerId, setManufacturerId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");

  const [file, setFile] = useState<File | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // CORRECT: load suppliers on mount
  useEffect(() => {
    fetchCompanies({ role: "supplier" }).then(setSuppliers);
    fetchCompanies({ role: "manufacturer" }).then(setManufacturers);
    fetchCategories().then(setCategories)
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

      // create item
    try {
      const res = await api.post("/items/", {
        name,
        description: description || undefined,
        catalogue_nr: catalogueNr || undefined,
        unit,
        manufacturer_id: manufacturerId === "" ? undefined : manufacturerId,
        supplier_id: supplierId === "" ? undefined : supplierId,
        category_id: categoryId  || undefined,
      });

      const itemId = res.data.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/items/${itemId}/image`, formData);
      }

      setMessage("Item created successfully");
      navigate("/items");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to create item");
    }
    
  };

  return (
    <PageContainer title="Create new Item">
    <FormLayout onSubmit={handleSubmit}>

      <FormField label="Select Category">
        <Select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Bridge</option>
            {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="space-y-6"></div>

      <FormField label="Name">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </FormField>

      <FormField label="Description">
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </FormField>

      <FormField label="Catalogue number">
        <Input
          value={catalogueNr}
          onChange={e => setCatalogueNr(e.target.value)}
        />
      </FormField>

      <FormField label="Unit">
        <Input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <Select
          value={manufacturerId}
          onChange={e =>
            setManufacturerId(
              e.target.value ? Number(e.target.value) : ""
            )  
          }
        >
          <option value="">Select manufacturer</option>
          {manufacturers.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}
          </option>
          ))}
        </Select>

        <Select
          value={supplierId}
          onChange={e =>
            setSupplierId(
              e.target.value ? Number(e.target.value) : ""
            )
          }

        >
          <option value="">Select supplier</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
          </option>
          ))}
        </Select>
      </div>

      <div className="space-y-6"></div>

      <div className="form-actions">
        <ImageUpload
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <Button variant="primary" type="submit">Save</Button>
        <Button type="button" onClick={() => navigate(-1)}>Cancel</Button>
      </div>
    </FormLayout>
    </PageContainer>
  );

}
