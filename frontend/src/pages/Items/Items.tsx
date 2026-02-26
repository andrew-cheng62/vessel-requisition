import { useEffect, useState } from "react";
import api, { fetchCompanies, fetchItems, setItemActive } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import type { Item, Company, Category } from "../../types";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import PageContainer from "../../components/layout/PageContainer";
import toast from "react-hot-toast";

export default function Items() {
  const { user, isCaptain, isSuperAdmin } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const pageSize = Number(searchParams.get("page_size") ?? 10);
  const currentPage = Number(searchParams.get("page") ?? 1);
  const requisitionId = searchParams.get("requisition_id");

  // Visibility toggles
  const showVesselInactive = searchParams.get("show_vessel_inactive") === "true";
  const showGlobalInactive = searchParams.get("show_inactive") === "true";  // super_admin only

  const filters = {
    search: searchParams.get("search") ?? "",
    category_id: searchParams.get("category_id") ?? "",
    manufacturer_id: searchParams.get("manufacturer_id") ?? "",
    supplier_id: searchParams.get("supplier_id") ?? "",
  };

  const filterConfig = [
    { key: "search", label: "Search", type: "text", placeholder: "Search items..." },
    { key: "category_id", type: "select", label: "Category",
      options: categories.map(c => ({ value: String(c.id), label: c.name })) },
    { key: "manufacturer_id", type: "select", label: "Manufacturer",
      options: manufacturers.map(m => ({ value: String(m.id), label: m.name })) },
    { key: "supplier_id", type: "select", label: "Supplier",
      options: suppliers.map(s => ({ value: String(s.id), label: s.name })) },
  ];

  useEffect(() => {
    fetchCompanies({ role: "supplier" }).then(res => setSuppliers(res.items));
    fetchCompanies({ role: "manufacturer" }).then(res => setManufacturers(res.items));
    api.get("/categories").then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = {
      page: currentPage,
      page_size: pageSize,
    };
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = Number(filters.category_id);
    if (filters.manufacturer_id) params.manufacturer_id = Number(filters.manufacturer_id);
    if (filters.supplier_id) params.supplier_id = Number(filters.supplier_id);
    if (showVesselInactive) params.show_vessel_inactive = "true";
    if (showGlobalInactive && isSuperAdmin) params.show_inactive = "true";

    fetchItems(params)
      .then(res => {
        setItems(res.items);
        setTotal(res.total);
        setPages(res.pages);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    next.set("page_size", String(pageSize));
    setSearchParams(next);
  };

  const changePage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  const handleOrder = async (item: Item) => {
    try {
      if (requisitionId) {
        await api.post(`/requisitions/${requisitionId}/items`, { item_id: item.id, quantity: 1 });
        navigate(`/requisitions/${requisitionId}`);
      } else {
        const res = await api.post("/requisitions/", {
          supplier_id: item.supplier?.id,
          items: [{ item_id: item.id, quantity: 1 }],
        });
        navigate(`/requisitions/${res.data.id}`);
      }
    } catch {
      toast.error("Failed to order item");
    }
  };

  // Toggle vessel-level visibility (captain)
  const handleVesselToggle = async (item: Item) => {
    const newActive = !item.vessel_active;
    try {
      await api.patch(`/items/${item.id}/vessel-active`, { is_active: newActive });
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, vessel_active: newActive } : i
      ));
      toast.success(newActive ? "Item visible on this vessel" : "Item hidden on this vessel");
    } catch {
      toast.error("Failed to update");
    }
  };

  // Toggle global active (super_admin only)
  const handleGlobalToggle = async (item: Item) => {
    const newActive = !item.is_active;
    try {
      await setItemActive(item.id, newActive);
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, is_active: newActive } : i
      ));
      toast.success(newActive ? "Item globally activated" : "Item globally deactivated");
    } catch {
      toast.error("Failed to update");
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
      {/* Visibility toggles */}
      <div className="flex gap-6 mb-4 text-sm">
        {isCaptain && !isSuperAdmin && (
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
            <input
              type="checkbox"
              checked={showVesselInactive}
              onChange={e => {
                const next = new URLSearchParams(searchParams);
                if (e.target.checked) next.set("show_vessel_inactive", "true");
                else next.delete("show_vessel_inactive");
                next.set("page", "1");
                setSearchParams(next);
              }}
            />
            Show hidden items
          </label>
        )}
        {isSuperAdmin && (
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
            <input
              type="checkbox"
              checked={showGlobalInactive}
              onChange={e => {
                const next = new URLSearchParams(searchParams);
                if (e.target.checked) next.set("show_inactive", "true");
                else next.delete("show_inactive");
                next.set("page", "1");
                setSearchParams(next);
              }}
            />
            Show globally inactive items
          </label>
        )}
      </div>

      <FilterBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        config={filterConfig as any}
      />

      <div className="flex justify-end mb-2">
        <select
          value={pageSize}
          onChange={e => {
            const next = new URLSearchParams(searchParams);
            next.set("page_size", e.target.value);
            next.set("page", "1");
            setSearchParams(next);
          }}
          className="border px-2 py-1 rounded text-sm"
        >
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {!loading && (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Manufacturer</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              {isCaptain && !isSuperAdmin && (
                <th className="px-4 py-3 text-center text-xs text-gray-500">Vessel visible</th>
              )}
              {isSuperAdmin && (
                <th className="px-4 py-3 text-center text-xs text-gray-500">Global active</th>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const dimmed = isSuperAdmin
                ? !item.is_active
                : !item.vessel_active;

              return (
                <tr key={item.id} className={`border-t border-gray-100 hover:bg-gray-50 ${dimmed ? "opacity-40" : ""}`}>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-500">{item.desc_short}</td>
                  <td className="px-4 py-3 text-gray-600">{item.manufacturer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{item.supplier?.name ?? "—"}</td>

                  {/* Captain: vessel-level toggle */}
                  {isCaptain && !isSuperAdmin && (
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.vessel_active ?? true}
                        onChange={() => handleVesselToggle(item)}
                        title={item.vessel_active ? "Hide on this vessel" : "Show on this vessel"}
                      />
                    </td>
                  )}

                  {/* Super admin: global toggle */}
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={() => handleGlobalToggle(item)}
                        title={item.is_active ? "Deactivate globally" : "Activate globally"}
                      />
                    </td>
                  )}

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/items/${item.id}`}>
                      <Button variant="ghost">View</Button>
                    </Link>
                    <Link to={`/items/${item.id}/edit`}>
                      <Button variant="ghost">Edit</Button>
                    </Link>
                    <Button variant="secondary" onClick={() => handleOrder(item)}>
                      Order
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {!loading && items.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No items found.</p>
      )}

      <Pagination page={currentPage} pages={pages} onChange={changePage} />
    </PageContainer>
  );
}