import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchCompanies } from "../../api/api";
import type { Company, CompanyRole } from "../../types";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import PageContainer from "../../components/layout/PageContainer";

type CompanyFilters = {
  search: string;
  role: CompanyRole | "";
};

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const pageSize = Number(searchParams.get("page_size") ?? 10);
  const currentPage = Number(searchParams.get("page") ?? 1);

  // 🔹 URL → typed filters
  const filters: CompanyFilters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      role: (searchParams.get("role") as CompanyRole) ?? "",
    }),
    [searchParams]
  );

  // 🔹 load companies when filters or page change
  useEffect(() => {
    setLoading(true);

    fetchCompanies({
      page: currentPage,
      page_size: pageSize,
      search: filters.search || undefined,
      role: filters.role || undefined,
    })
      .then((res) => {
        setCompanies(res.items);
        setTotal(res.total);
        setPages(res.pages);
      })
      .finally(() => setLoading(false));
  }, [filters.search, filters.role, currentPage, pageSize]);

  // 🔹 update single filter
  const updateFilter = (key: keyof CompanyFilters, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    next.set("page", "1"); // reset to first page on filter change

    setSearchParams(next);
  };

  // 🔹 reset all filters
  const resetFilters = () => {
    setSearchParams({ page: "1" });
  };

  // 🔹 change page
  const changePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  };

  const filterConfig = [
    {
      key: "search",
      type: "text",
      label: "Search companies",
      placeholder: "Search company...",
    },
    {
      key: "role",
      type: "select",
      label: "Company role",
      options: [
        { value: "supplier", label: "Suppliers" },
        { value: "manufacturer", label: "Manufacturers" },
      ],
    },
  ] as const;

  return (
    <PageContainer
      title="Companies"
      actions={
        <Link to="/companies/new">
          <Button variant="primary">Add Company</Button>
        </Link>
      }
    >
      <FilterBar
        filters={filters}
        config={filterConfig}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {loading && (
        <p className="text-sm text-gray-500 mt-4">Loading…</p>
      )}

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

      <Table>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left w-12">#</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Company Role</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c, index) => (
            <tr key={c.id} className="h-14 border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">
                {(currentPage - 1) * 10 + index + 1}
              </td>
              <td className="px-4 py-3 font-medium">
                {c.name}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {c.is_manufacturer && "Manufacturer "}
                {c.is_supplier && "Supplier"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/companies/${c.id}`}>
                  <Button variant="ghost">View</Button>
                </Link>
                <Link to={`/companies/${c.id}/edit`}>
                  <Button variant="ghost">Edit</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {!loading && companies.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          No companies found
        </p>
      )}

      <Pagination
        page={currentPage}
        pages={pages}
        onChange={changePage}
      />
    </PageContainer>
  );
}
