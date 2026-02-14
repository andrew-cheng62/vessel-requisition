import { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useNavigate } from "react-router-dom";
import type { Company } from "../../types";

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

      setMessage("Company saved successfully");
      navigate(`/companies/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save company");
    }
  };

/* DELETE LOGO */
  const deleteLogo = async () => {
    if (!confirm("Delete company logo?")) return;

    await api.delete(`/companies/${id}/logo`);
    setCompany(prev => prev ? { ...prev, logo_path: null } : prev);
  };

  if (!company) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSave}>
      <h2>Edit Company</h2>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        placeholder="Phone"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />

      <input
        placeholder="Website"
        value={website}
        onChange={e => setWebsite(e.target.value)}
      />
      
      <input
        placeholder="Comments"
        value={comments}
        onChange={e => setComments(e.target.value)}
      />

      <label>
        <input
          type="checkbox"
          checked={isManufacturer}
          onChange={e => setIsManufacturer(e.target.checked)}
        />
        Manufacturer
      </label>

      <label>
        <input
          type="checkbox"
          checked={isSupplier}
          onChange={e => setIsSupplier(e.target.checked)}
        />
        Supplier
      </label>

      {/* LOGO PREVIEW */}
      {company.logo_path && (
        <div>
          <img
            src={`http://localhost:8000/${company.logo_path}`}
            style={{ width: 150, display: "block", marginBottom: 8 }}
          />
          <button type="button" onClick={deleteLogo}>
            Delete logo
          </button>
        </div>
      )}

      <input
        type="file"
        accept="logo/*"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />


      <button type="submit">Save</button>
    </form>
  );
}
