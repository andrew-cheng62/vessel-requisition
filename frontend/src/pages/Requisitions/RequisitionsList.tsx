import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { fetchCompanies } from "../../api/api";
import type { Requisition, Supplier } from "../../types";
import FilterBar from "../../components/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import PageContainer from "../../components/layout/PageContainer";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    status: searchParams.get("status") ?? "",
    supplier_id: searchParams.get("supplier_id") ?? "",
  };

  // load suppliers once
  useEffect(() => {
    fetchCompanies({ role: "supplier" }).then(setSuppliers);
  }, []);

  // fetch data on URL change
  useEffect(() => {
    setLoading(true);

    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.supplier_id) params.supplier_id = Number(filters.supplier_id);

    api
      .get("/requisitions", { params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  const filterConfig = [
    {
      key: "status",
      type: "select",
      label: "All statuses",
      options: STATUSES.map(s => ({
        value: s,
        label: s.replace("_", " ").toUpperCase(),
      })),
    },
    {
      key: "supplier_id",
      type: "select",
      label: "All suppliers",
      options: suppliers.map(s => ({
        value: String(s.id),
        label: s.name,
      })),
    },
  ];

  return (
  <PageContainer title="Requisitions">

      <FilterBar
        filters={filters}
        config={filterConfig}
        onChange={updateFilter}
        onReset={resetFilters}
      />

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
            {data.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.status}</td>
                <td>{r.supplier?.name ?? "-"}</td>
                <td>{r.items.length}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <Link to={`/requisitions/${r.id}`}>
                    <Button variant="ghost">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
  </PageContainer>
  );
}
