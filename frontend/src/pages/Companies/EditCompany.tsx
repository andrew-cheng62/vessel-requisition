import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import type { Company } from "../../types";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import toast from "react-hot-toast";


export default function EditCompany() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comments, setComments] = useState("");
  const [isManufacturer, setIsManufacturer] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [company, setCompany] = useState<Company[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [logoDeleted, setLogoDeleted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /* LOAD COMPANY */
  useEffect(() => {
    api.get(`/companies/${id}`).then(res => {
      const data = res.data;
      setCompany(data);
      setName(data.name);
      setWebsite(data.website || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setComments(data.comments || "");
      setIsManufacturer(!!data.is_manufacturer);
      setIsSupplier(!!data.is_supplier);
    });
  }, [id]);

  /* SAVE COMPANY*/
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await api.put(`/companies/${id}`, {
        name,
        website: website || null,
        email: email || null,
        phone: phone || null,
        comments: comments || null,
        is_manufacturer: isManufacturer,
        is_supplier: isSupplier,
      });

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/companies/${id}/logo`, formData);
      }

      toast.success("Company saved successfully");
      setTimeout(() => navigate(`/companies/${id}`), 800);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save company");
    }
  };

/* DELETE LOGO */
  const deleteLogo = async () => {
    if (!confirm("Delete company logo?")) return;

    await api.delete(`/companies/${id}/logo`);
    setCompany(prev => prev ? { ...prev, logo_path: null } : prev);
    setLogoDeleted(true);
    toast.success("Company logo deleted successfully");
  };

  if (!company) return <p>Loading...</p>;

  return (

    <PageContainer title="Edit Company">
      <FormLayout onSubmit={handleSave}>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

        <FormField label="Edit Name">
          <Input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
         />
        </FormField>

        <FormField label="Edit e-mail">
          <Input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
        />
        </FormField>

        <FormField label="Edit Phone">
          <Input
            placeholder="Phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
        />
        </FormField>

        <FormField label="Edit Website">
          <Input
            placeholder="Website"
            value={website}
            onChange={e => setWebsite(e.target.value)}
        />
        </FormField>

        <FormField label="Edit Comments">
          <Input
            placeholder="Comments"
            value={comments}
            onChange={e => setComments(e.target.value)}
        />
        </FormField>

        <FormField>
          <label>
            <input
              type="checkbox"
              checked={isManufacturer}
              onChange={e => setIsManufacturer(e.target.checked)}
            />
            Manufacturer
          </label>{" "}

          <label>
            <input
              type="checkbox"
              checked={isSupplier}
              onChange={e => setIsSupplier(e.target.checked)}
            />
            Supplier
          </label>
          </FormField>

      {/* LOGO PREVIEW */}
      {company.logo_path && !logoDeleted && (
        <div>
          <img
            src={`http://localhost:8000/${company.logo_path}`}
            className="w-40 mb-2 rounded"
          />
          <Button
            variant="delete"
            type="button"
            onClick={deleteLogo}
          >
            Delete logo
          </Button>
        </div>
      )}
 
     <div className="form-actions space-y-6">

     {(!company.logo_path || logoDeleted) && (

        <ImageUpload
          file={file}
          onChange={setFile}
          disabled={!!company.logo_path && !logoDeleted}
        />
     )}

        <Button variant="ghost" type="submit">
          Save
        </Button>

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
