import { useEffect, useState } from "react";
import api, { deleteItem, fetchCompanies } from "../../api/api";
import type { Item, Supplier, Manufacturer, Company, Category } from "../../types";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import PageContainer from "../../components/layout/PageContainer";
import toast from "react-hot-toast";


type ItemFilters = {
  search?: string;
  category_id?: number;
  manufacturer_id?: number;
  supplier_id?: number;
};

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const requisitionId = searchParams.get("requisition_id");
  const navigate = useNavigate();
  
  const filters = {
    search: searchParams.get("search") ?? "",
    category_id: searchParams.get("category_id") ?? "",
    manufacturer_id: searchParams.get("manufacturer_id") ?? "",
    supplier_id: searchParams.get("supplier_id") ?? "",
  };

  const filterConfig = [
  {
    key: "search",
    label: "Search",
    type: "text",
    placeholder: "Search items...",
  },
  {
    key: "category_id",
    type: "select",
    label: "Categories",
    options: categories.map(c => ({
      value: String(c.id),
      label: c.name
    })),
  },
  {
    key: "manufacturer_id",
    type: "select",
    label: "Manufacturers",
    options: manufacturers.map(m => ({
      value: String(m.id),
      label: m.name
    })),
  },
  {
    key: "supplier_id",
    type: "select",
    label: "Suppliers",
    options: suppliers.map(s => ({
      value: String(s.id),
      label: s.name
      })),
    },
  ];

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    setSearchParams(next);
  };

  // load reference data once
  useEffect(() => {
    fetchCompanies({ role: "supplier" }).then(setSuppliers);
    fetchCompanies({ role: "manufacturer" }).then(setManufacturers);
    api.get("/categories").then(r => setCategories(r.data));
  }, []);

  // reload on filters change

  useEffect(() => {
    const params: any = {};
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = Number(filters.category_id);
    if (filters.manufacturer_id) params.manufacturer_id = Number(filters.manufacturer_id);
    if (filters.supplier_id) params.supplier_id = Number(filters.supplier_id);

    api.get("/items", { params }).then(res => setItems(res.data));
  }, [searchParams]);

  const resetFilters = () => {
    setSearchParams({});
};

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteItem(id);
      setItems(items.filter(i => i.id !== id));
      toast.success("Item deleted");
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ??
        "Item cannot be deleted because it is used in requisitions"
      );
    }
  };

  const handleOrder = async (item: Item) => {
    try {
      if (requisitionId) {
        await api.post(`/requisitions/${requisitionId}/items`, {
          item_id: item.id,
          quantity: 1,
        });
        navigate(`/requisitions/${requisitionId}`);
      } else {
        const res = await api.post("/requisitions", {
          supplier_id: item.supplier?.id,
          items: [{ item_id: item.id, quantity: 1 }],
        });
        navigate(`/requisitions/${res.data.id}`);
      }
    } catch {
      toast.error("Failed to order item");
    }
  };

  return (
    <PageContainer
      title="Items"
      actions={
        <Link to="/items/new">
          <Button variant="primary">Add Item</Button>
        </Link>
      }
     >

      <FilterBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        config={filterConfig}
      />

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {!loading && (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="max-w-64 px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Manufacturer</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Catalogue Nr</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-left">{item.name}</td>
                <td className="max-w-64 px-4 py-3">
                  <div className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.description}
                  </div>
                </td>
                <td className="px-4 py-3 text-left">{item.manufacturer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-left">{item.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3 text-left">{item.catalogue_nr ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link to={`/items/${item.id}`}>
                    <Button variant="ghost">View</Button>
                  </Link>{" "}
                  <Link to={`/items/${item.id}/edit`}>
                    <Button variant="ghost">Edit</Button>
                  </Link>{" "}
                  <Button variant="secondary" onClick={() => handleOrder(item)}>Order
                  </Button>{" "}
                  <Button variant="delete" onClick={() => handleDelete(item.id)}>❌
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageContainer>
  );
}
