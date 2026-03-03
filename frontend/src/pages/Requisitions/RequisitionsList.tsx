import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { fetchAllCompanies } from "../../api/api";
import type { Requisition, Company } from "../../types";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import PageContainer from "../../components/layout/PageContainer";
import StatusBadge from "../../components/status/StatusBadge";
import Pagination from "../../components/ui/Pagination";
import toast from "react-hot-toast";

const STATUSES = [
  "draft",
  "rfq_sent",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
];

export default function RequisitionsList() {
  const [data, setData] = useState<Requisition[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const pageSize = Number(searchParams.get("page_size") ?? 10);
  const currentPage = Number(searchParams.get("page") ?? 1);

  const filters = {
    status: searchParams.get("status") ?? "",
    supplier_id: searchParams.get("supplier_id") ?? "",
  };

  useEffect(() => {
    fetchAllCompanies("supplier").then(setSuppliers);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { page: currentPage, page_size: pageSize };
    if (filters.status) params.status = filters.status;
    if (filters.supplier_id) params.supplier_id = Number(filters.supplier_id);

    api.get("/requisitions", { params })
      .then(res => {
        setData(res.data.items);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [searchParams, pageSize]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams({});

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this requisition?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/requisitions/${id}`);
      setData(prev => prev.filter(r => r.id !== id));
      toast.success("Requisition deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const changePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  };

  const filterConfig = [
    {
      key: "status",
      type: "select",
      label: "Status",
      options: STATUSES.map(s => ({ value: s, label: s.replace("_", " ").toUpperCase() })),
    },
    {
      key: "supplier_id",
      type: "select",
      label: "Supplier",
      options: suppliers.map(s => ({ value: String(s.id), label: s.name })),
    },
  ];

  return (
    <PageContainer title="Requisitions">
      <FilterBar filters={filters} config={filterConfig} onChange={updateFilter} onReset={resetFilters} />

      <div className="place-items-end mb-3">
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
      {!loading && data.length === 0 && <p className="text-sm text-gray-500 mt-4">No requisitions found</p>}

      {!loading && data.length > 0 && (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map(r => {
              const canDelete = r.status === "draft" || r.status === "cancelled";
              return (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">{r.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.items.length}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Link to={`/requisitions/${r.id}`}>
                      <Button variant="ghost">View</Button>
                    </Link>
                    {canDelete && (
                      <Button
                        variant="delete"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? "…" : "Delete"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Pagination page={currentPage} pages={pages} onChange={changePage} />
    </PageContainer>
  );
}
