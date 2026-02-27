import { useEffect, useState } from "react";
import api, { fetchCompanies, fetchItems, setItemActive } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import type { Item, Company, Category, Tag } from "../../types";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import PageContainer from "../../components/layout/PageContainer";
import TagBadge from "../../components/ui/TagBadge";
import toast from "react-hot-toast";

export default function Items() {
  const { isCaptain, isSuperAdmin } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const pageSize = Number(searchParams.get("page_size") ?? 10);
  const currentPage = Number(searchParams.get("page") ?? 1);
  const requisitionId = searchParams.get("requisition_id");
  const showVesselInactive = searchParams.get("show_vessel_inactive") === "true";
  const showGlobalInactive = searchParams.get("show_inactive") === "true";

  // Selected tag ids from URL e.g. "1,2"
  const selectedTagIds = searchParams.get("tag_ids")
    ? searchParams.get("tag_ids")!.split(",").map(Number)
    : [];

  const filters = {
    search: searchParams.get("search") ?? "",
    category_id: searchParams.get("category_id") ?? "",
    manufacturer_id: searchParams.get("manufacturer_id") ?? "",
    supplier_id: searchParams.get("supplier_id") ?? "",
  };

  const filterConfig = [
    { key: "search", label: "Search", type: "text", placeholder: "Name, catalogue nr, description..." },
    { key: "category_id", type: "select", label: "Category",
      options: categories.map(c => ({ value: String(c.id), label: c.name })) },
    { key: "manufacturer_id", type: "select", label: "Manufacturer",
      options: manufacturers.map(m => ({ value: String(m.id), label: m.name })) },
    { key: "supplier_id", type: "select", label: "Supplier",
      options: suppliers.map(s => ({ value: String(s.id), label: s.name })) },
  ];

  // Load reference data once
  useEffect(() => {
    fetchCompanies({ role: "supplier" }).then(res => setSuppliers(res.items));
    fetchCompanies({ role: "manufacturer" }).then(res => setManufacturers(res.items));
    api.get("/categories").then(res => setCategories(res.data));
    api.get("/tags").then(res => setAllTags(res.data));
    api.get("/items/recently-ordered?limit=8").then(res => setRecentItems(res.data));
  }, []);

  // Reload items on filter/page change
  useEffect(() => {
    setLoading(true);
    const params: any = { page: currentPage, page_size: pageSize };
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = Number(filters.category_id);
    if (filters.manufacturer_id) params.manufacturer_id = Number(filters.manufacturer_id);
    if (filters.supplier_id) params.supplier_id = Number(filters.supplier_id);
    if (selectedTagIds.length) params.tag_ids = selectedTagIds.join(",");
    if (showVesselInactive) params.show_vessel_inactive = "true";
    if (showGlobalInactive && isSuperAdmin) params.show_inactive = "true";

    fetchItems(params)
      .then(res => { setItems(res.items); setTotal(res.total); setPages(res.pages); })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const toggleTag = (tagId: number) => {
    const next = new URLSearchParams(searchParams);
    const current = selectedTagIds;
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    if (updated.length) next.set("tag_ids", updated.join(","));
    else next.delete("tag_ids");
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
    } catch { toast.error("Failed to order item"); }
  };

  const handleVesselToggle = async (item: Item) => {
    const newActive = !item.vessel_active;
    try {
      await api.patch(`/items/${item.id}/vessel-active`, { is_active: newActive });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, vessel_active: newActive } : i));
      toast.success(newActive ? "Item visible on this vessel" : "Item hidden on this vessel");
    } catch { toast.error("Failed to update"); }
  };

  const handleGlobalToggle = async (item: Item) => {
    const newActive = !item.is_active;
    try {
      await setItemActive(item.id, newActive);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newActive } : i));
      toast.success(newActive ? "Item globally activated" : "Item globally deactivated");
    } catch { toast.error("Failed to update"); }
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

      {/* Recently Ordered Strip */}
      {recentItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Recently Ordered
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleOrder(item)}
                className="shrink-0 flex flex-col items-start px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-sky-400 hover:shadow-sm transition-all text-left min-w-[120px] max-w-[160px]"
                title={`Order ${item.name}`}
              >
                <span className="text-xs font-medium text-gray-800 truncate w-full">{item.name}</span>
                <span className="text-xs text-gray-400 mt-0.5">{item.unit}</span>
                {item.tags.slice(0, 1).map(tag => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allTags.map(tag => {
            const active = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  active ? "opacity-100 shadow-sm" : "opacity-50 hover:opacity-75"
                }`}
                style={{
                  backgroundColor: active ? tag.color + "22" : "transparent",
                  color: tag.color,
                  borderColor: tag.color + "66",
                }}
              >
                {tag.name}
                {active && <span className="ml-1">×</span>}
              </button>
            );
          })}
          {selectedTagIds.length > 0 && (
            <button
              onClick={() => { const n = new URLSearchParams(searchParams); n.delete("tag_ids"); setSearchParams(n); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Clear tags
            </button>
          )}
        </div>
      )}

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

      <FilterBar filters={filters} onChange={updateFilter} onReset={resetFilters} config={filterConfig as any} />

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
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {!loading && (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-left">Manufacturer</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              {isCaptain && !isSuperAdmin && (
                <th className="px-4 py-3 text-center text-xs text-gray-500">Visible</th>
              )}
              {isSuperAdmin && (
                <th className="px-4 py-3 text-center text-xs text-gray-500">Active</th>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const dimmed = isSuperAdmin ? !item.is_active : !item.vessel_active;
              return (
                <tr key={item.id} className={`border-t border-gray-100 hover:bg-gray-50 ${dimmed ? "opacity-40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.desc_short && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{item.desc_short}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{item.manufacturer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{item.supplier?.name ?? "—"}</td>
                  {isCaptain && !isSuperAdmin && (
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={item.vessel_active ?? true}
                        onChange={() => handleVesselToggle(item)} />
                    </td>
                  )}
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={item.is_active}
                        onChange={() => handleGlobalToggle(item)} />
                    </td>
                  )}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/items/${item.id}`}><Button variant="ghost">View</Button></Link>
                    <Link to={`/items/${item.id}/edit`}><Button variant="ghost">Edit</Button></Link>
                    <Button variant="secondary" onClick={() => handleOrder(item)}>Order</Button>
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
