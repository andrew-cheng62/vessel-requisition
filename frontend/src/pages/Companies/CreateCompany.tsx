import { useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { FormLayout, FormField } from "../../components/layout/FormLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import PageContainer from "../../components/layout/PageContainer";
import { ImageUpload } from "../../components/ui/ImageUpload";
import toast from "react-hot-toast";

export default function CreateCompany() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comments, setComments] = useState("");
  const [isManufacturer, setIsManufacturer] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [logopath, setLogopath] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isActive, setIsactive] = useState(true);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const res = await api.post("/companies", {
    name,
    website,
    email,
    phone,
    comments,
    is_manufacturer: isManufacturer,
    is_supplier: isSupplier,
  });

  const companyId = res.data.id;

  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    await api.post(`/companies/${res.data.id}/logo`, formData);
  }

  toast.success("Company created");
  setTimeout(() => navigate(`/companies/`), 800);
};


  return (
    <PageContainer title="Add New Company">

      <FormLayout onSubmit={handleSubmit}>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      
        <Input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Input
          placeholder="Phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <Input
          placeholder="Website"
          value={website}
          onChange={e => setWebsite(e.target.value)}
        />
        <Input
          placeholder="Comments"
          value={comments}
          onChange={e => setComments(e.target.value)}
        />

        <FormField>
        <label>
          <input type="checkbox"
                 checked={isManufacturer}
                 onChange={e => setIsManufacturer(e.target.checked)}
          />
            Manufacturer
        </label>{"  "}
      
        <label>
          <input type="checkbox"
                 checked={isSupplier}
                 onChange={e => setIsSupplier(e.target.checked)}
         />
           Supplier
        </label>
        </FormField>

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