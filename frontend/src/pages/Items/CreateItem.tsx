import { useEffect, useState } from "react";
import api, { fetchCompanies, fetchCategories } from "../../api/api";
import type { Company, Category } from "../../types";
import { useNavigate } from "react-router-dom"; 
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { ImageUpload } from "../../components/ui/ImageUpload";
import toast from "react-hot-toast";


export default function CreateItem() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catalogueNr, setCatalogueNr] = useState("");
  const [unit, setUnit] = useState("");
  const [manufacturerId, setManufacturerId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
        manufacturer_id: manufacturerId || undefined,
        supplier_id: supplierId || undefined,
        category_id: categoryId  || undefined,
      });

      const itemId = res.data.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/items/${itemId}/image`, formData);
      }

      toast.success("Item created successfully");
      setTimeout(() => navigate(`/items/${itemId}`), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? "Failed to create item");
    }
    
  };

  return (
    <PageContainer title="Add New Item">

      <FormLayout onSubmit={handleSubmit}>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

          <Select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
      
      <Input
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />

      <Input
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <Input
        placeholder="Catalogue number"
        value={catalogueNr}
        onChange={e => setCatalogueNr(e.target.value)}
      />

      <Input
        placeholder="Unit"
        value={unit}
        onChange={e => setUnit(e.target.value)}
        required
      />

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

      <div className="form-actions space-y-6">
        <ImageUpload
          file={file}
          onChange={setFile}
        />

        <Button variant="ghost" type="submit">Save</Button>{" "}
        <Button variant="delete" onClick={() => navigate(-1)}>Cancel</Button>
      </div>
    </FormLayout>
    </PageContainer>
  );
}
