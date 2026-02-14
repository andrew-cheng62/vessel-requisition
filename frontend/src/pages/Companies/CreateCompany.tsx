import { useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

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

  alert("Company created");
  navigate("/companies");
};


  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Company</h2>

      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <input placeholder="Website" value={website} onChange={e => setWebsite(e.target.value)} />
      <input placeholder="Comments" value={comments} onChange={e => setComments(e.target.value)} />

      <label>
        <input type="checkbox" checked={isManufacturer} onChange={e => setIsManufacturer(e.target.checked)} />
        Manufacturer
      </label>
      
      <label>
        <input type="checkbox" checked={isSupplier} onChange={e => setIsSupplier(e.target.checked)} />
        Supplier
      </label>

      <div>
      <label>
        Company logo
      </label>
       </div>
        <input
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
 
      <button type="submit">Create</button>
    </form>
  );
}