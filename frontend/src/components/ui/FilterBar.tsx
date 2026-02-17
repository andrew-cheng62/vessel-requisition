import Button from "./Button";
import Input from "./Input";

type Option = {
  value: string | number;
  label: string;
};

type FilterConfig =
  | {
      key: string;
      label: string;
      type: "select";
      options: Option[];
    }
  | {
      key: string;
      label: string;
      type: "text";
      placeholder?: string;
    };

type Props = {
  filters: Record<string, any>;
  config: FilterConfig[];
  onChange: (key: string, value: any) => void;
  onReset: () => void;
};

export default function FilterBar({
  filters,
  config,
  onChange,
  onReset,
}: Props) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border">
      {config.map((f) => {
        if (f.type === "text") {
          return (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{f.label}</label>
              <Input
                value={filters[f.key] ?? ""}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
              />
            </div>
          );
        }

        if (f.type === "select") {
          return (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">{f.label}</label>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters[f.key] ?? ""}
                onChange={(e) =>
                  onChange(f.key, e.target.value || undefined)
                }
              >
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return null;
      })}

      <div className="ml-auto">
        <Button
          variant="primary"
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
