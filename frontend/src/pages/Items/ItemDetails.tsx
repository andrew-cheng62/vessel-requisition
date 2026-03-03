import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import PageCard from "../../components/layout/PageCard/PageCard";
import type { Item } from "../../types";
import Button from "../../components/ui/Button";
import TagBadge from "../../components/ui/TagBadge";
import toast from "react-hot-toast";

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    api.get(`/items/${id}`).then(res => setItem(res.data));
  }, [id]);

  const handleOrder = async () => {
    try {
      const res = await api.post("/requisitions/", {
        supplier_id: item?.supplier?.id ?? null,
        items: [{ item_id: item!.id, quantity: 1 }],
      });
      navigate(`/requisitions/${res.data.id}`);
    } catch {
      toast.error("Failed to create requisition");
    }
  };

  if (!item) return <p className="p-6 text-gray-500">Loading…</p>;

  return (
    <PageCard>
      <div className="grid grid-cols-[300px_1fr] gap-8">

        {/* IMAGE */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-64 flex items-center justify-center text-gray-400 text-sm">
          {item.image_path
            ? <img src={`http://localhost:8000/${item.image_path}`} className="w-full h-full object-contain" alt={item.name} />
            : "No image"
          }
        </div>

        {/* DETAILS */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">{item.name}</h2>

          {item.desc_short && (
            <p className="text-gray-500 text-sm mb-3">{item.desc_short}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
            </div>
          )}

          <table className="text-sm mb-4">
            <tbody>
              {[
                ["Catalogue Nr", item.catalogue_nr || "—"],
                ["Unit", item.unit],
                ["Category", item.category?.name ?? "—"],
                ["Manufacturer", item.manufacturer?.name ?? "—"],
                ["Supplier", item.supplier?.name ?? "—"],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="pr-6 py-1 text-gray-500 font-medium">{label}</td>
                  <td className="py-1 text-gray-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {item.desc_long && (
            <p className="text-sm text-gray-600 mb-4">{item.desc_long}</p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleOrder}>
              Order
            </Button>
            <Link to={`/items/${item.id}/edit`}>
              <Button variant="ghost">Edit</Button>
            </Link>
          </div>
        </div>

      </div>
    </PageCard>
  );
}
