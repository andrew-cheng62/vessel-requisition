import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { fetchCompanies } from "../../api/api";
import type { Requisition, Supplier } from "../../types";
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  // load suppliers once
  useEffect(() => {
    fetchCompanies({ role: "supplier" }).then(res => setSuppliers(res.items));
  }, []);

  // fetch data on URL change
  useEffect(() => {
    setLoading(true);

    const params: any = {
      page: Number(searchParams.get("page") ?? 1),
      page_size: pageSize
    };
    if (filters.status) params.status = filters.status;
    if (filters.supplier_id)
      params.supplier_id = Number(filters.supplier_id);

    api
      .get("/requisitions", { params })
      .then(res => {
        setData(res.data.items);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [searchParams, pageSize]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  // DELETE HANDLER
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this requisition?"
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);

      await api.delete(`/requisitions/${id}`);

      // Remove deleted row from UI
      setData(prev => prev.filter(r => r.id !== id));
      toast.success("Requisition deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filterConfig = [
    {
      key: "status",
      type: "select",
      label: "Status",
      options: STATUSES.map(s => ({
        value: s,
        label: s.replace("_", " ").toUpperCase(),
      })),
    },
    {
      key: "supplier_id",
      type: "select",
      label: "Supplier",
      options: suppliers.map(s => ({
        value: String(s.id),
        label: s.name,
      })),
    },
  ];

  const changePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  };

  return (
    <PageContainer title="Requisitions">
      <FilterBar
        filters={filters}
        config={filterConfig}
        onChange={updateFilter}
        onReset={resetFilters}
      />

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

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && data.length === 0 && <p>No requisitions found</p>}

      {!loading && data.length > 0 && (
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Items</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => {
              const canDelete =
                r.status === "draft" || r.status === "cancelled";

              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.supplier?.name ?? "-"}</td>
                  <td>{r.items.length}</td>
                  <td>
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="flex gap-2">
                    <Link to={`/requisitions/${r.id}`}>
                      <Button variant="ghost">View</Button>
                    </Link>

                    {canDelete && (
                      <Button
                        variant="delete"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id
                          ? "Deleting..."
                          : "🞬"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
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
