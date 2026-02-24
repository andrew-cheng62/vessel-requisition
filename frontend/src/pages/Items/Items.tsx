import { useEffect, useState } from "react";
import api, { setItemActive, fetchCompanies } from "../../api/api";
import { getCurrentUser } from "../../auth";
import type { Item, Supplier, Manufacturer, Company, Category } from "../../types";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import PageContainer from "../../components/layout/PageContainer";
import toast from "react-hot-toast";

type ItemFilters = {
  search?: string;
  category_id?: number;
  manufacturer_id?: number;
  supplier_id?: number;
};

export default function Items() {
  const user = getCurrentUser();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const requisitionId = searchParams.get("requisition_id");
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const pageSize = Number(searchParams.get("page_size") ?? 10);
  const currentPage = Number(searchParams.get("page") ?? 1);
  
  const filters = {
    search: searchParams.get("search") ?? "",
    category_id: searchParams.get("category_id") ?? "",
    manufacturer_id: searchParams.get("manufacturer_id") ?? "",
    supplier_id: searchParams.get("supplier_id") ?? ""
  };

  const showInactive = searchParams.get("show_inactive") === "true";

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
    fetchCompanies({ role: "supplier" }).then(res => setSuppliers(res.items));
    fetchCompanies({ role: "manufacturer" }).then(res => setManufacturers(res.items));
    api.get("/categories").then(res => setCategories(res.data));
  }, []);

  // reload on filters change

  useEffect(() => {
    const params: any = {
      page: Number(searchParams.get("page") ?? 1),
      page_size: pageSize
    };

    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = Number(filters.category_id);
    if (filters.manufacturer_id) params.manufacturer_id = Number(filters.manufacturer_id);
    if (filters.supplier_id) params.supplier_id = Number(filters.supplier_id);
    if (!showInactive) {params.is_active = true;}

    api.get("/items", { params }).then(res => {
      setItems(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
      });
  }, [searchParams, pageSize]);

  const resetFilters = () => {
    const next = new URLSearchParams();
    next.set("page_size", String(pageSize));
    next.set("page", "1");

    // DO NOT touch show_inactive
    if (showInactive) {
      next.set("show_inactive", "true");
    }

    setSearchParams(next);
  };

  const changePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
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

     {user?.role === "captain" && (
       <div className="mb-3">
         <label className="flex items-center gap-2">
           <input
             type="checkbox"
             checked={showInactive}
             onChange={(e) => {
               const next = new URLSearchParams(searchParams);
               if (e.target.checked) {
                 next.set("show_inactive", "true");
               } else {
                 next.delete("show_inactive");
               }
               next.set("page", "1");
               setSearchParams(next);
             }}
           />
           Show inactive items
         </label>
       </div>
     )}

      <FilterBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        config={filterConfig}
      />

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {/* Page size selector */}
       <div className="place-items-end">
        <div>
          <select
            value={pageSize}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set("page_size", e.target.value);
              next.set("page", "1"); // reset page
              setSearchParams(next);
            }}
            className="border px-2 py-1 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {!loading && (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="max-w-64 px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Manufacturer</th>
              <th className="px-4 py-3 text-left">Supplier</th>
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
                <td className="px-4 py-3">
                  <Link to={`/items/${item.id}`}>
                    <Button variant="ghost">View</Button>
                  </Link>{" "}
                  <Link to={`/items/${item.id}/edit`}>
                    <Button variant="ghost">Edit</Button>
                  </Link>{" "}
                  <Button variant="secondary" onClick={() => handleOrder(item)}>Order
                  </Button>{" "}

                  {user?.role === "captain" && (
                    <input type="checkbox"
                      checked={item.is_active}
                      onChange={async () => {
                        try {
                          await setItemActive(item.id, !item.is_active);

                          if (!showInactive && item.is_active) {
                            // removing active item while in active-only mode
                            setItems(prev => prev.filter(i => i.id !== item.id));
                          } else {
                            setItems(prev =>
                              prev.map(i =>
                                i.id === item.id
                                  ? { ...i, is_active: !i.is_active }
                                  : i
                              )
                            );
                          }

                          toast.success("Status updated");
                        } catch {
                          toast.error("Failed to update status");
                        }
                      }}
                    />
                )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

    <Pagination
      page={currentPage}
      pages={pages}
      onChange={changePage}
    />

    </PageContainer>
  );
}
