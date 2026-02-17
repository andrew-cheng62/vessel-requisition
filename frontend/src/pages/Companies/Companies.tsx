import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchCompanies } from "../../api/api";
import type { Company, CompanyRole } from "../../types";
import FilterBar from "../../components/ui/FilterBar";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import PageContainer from "../../components/layout/PageContainer";

type CompanyFilters = {
  search: string;
  role: CompanyRole | "";
};

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // 🔹 URL → typed filters
  const filters: CompanyFilters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      role: (searchParams.get("role") as CompanyRole) ?? "",
    }),
    [searchParams]
  );

  // 🔹 load companies when filters change
  useEffect(() => {
    fetchCompanies({
      search: filters.search || undefined,
      role: filters.role || undefined,
    }).then(setCompanies);
  }, [filters.search, filters.role]);

  // 🔹 update single filter
  const updateFilter = (key: keyof CompanyFilters, value: string) => {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    setSearchParams(next);
  };

  // 🔹 reset all filters
  const resetFilters = () => {
    setSearchParams({});
  };

  // 🔹 FilterBar config
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

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      <Table>
        <thead className="bg-gray-50">
          <tr>
            <th>Name</th>
            <th>Company Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
              {companies.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                {c.is_manufacturer && "Manufacturer "}
                {c.is_supplier && "Supplier"}
              </td>
              <td>
                <Link to={`/companies/${c.id}`}>
                  <Button variant="ghost">View</Button>
                </Link>{" "}
                <Link to={`/companies/${c.id}/edit`}>
                  <Button variant="ghost">Edit</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

        {companies.length === 0 && (
        <p style={{ marginTop: 16 }}>No companies found</p>
      )}
   </PageContainer>
  );
}
