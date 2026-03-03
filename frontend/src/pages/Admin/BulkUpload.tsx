import { useRef, useState } from "react";
import api from "../../api/api";
import PageContainer from "../../components/layout/PageContainer";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type RowStatus = "new" | "duplicate" | "error";
type RowAction = "create" | "update" | "skip";

interface ItemRow {
  row: number;
  status: RowStatus;
  name: string;
  catalogue_nr: string;
  unit: string;
  category: string;
  desc_short: string;
  desc_long: string;
  manufacturer: string;
  supplier: string;
  tags: string;
  image_path: string;
  error?: string;
  existing_id?: number;
  action?: RowAction;
}

interface CompanyRow {
  row: number;
  status: RowStatus;
  name: string;
  email: string;
  phone: string;
  website: string;
  is_supplier: boolean;
  is_manufacturer: boolean;
  comments: string;
  error?: string;
  existing_id?: number;
  action?: RowAction;
}

interface PreviewSummary {
  total: number;
  new_count: number;
  duplicate_count: number;
  error_count: number;
}

type UploadMode = "items" | "companies";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<RowStatus, string> = {
  new: "bg-emerald-50 text-emerald-700",
  duplicate: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-600",
};

const STATUS_LABEL: Record<RowStatus, string> = {
  new: "New",
  duplicate: "Duplicate",
  error: "Error",
};

function StatusBadge({ status }: { status: RowStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function ActionSelect({
  value,
  onChange,
  isDuplicate,
}: {
  value: RowAction;
  onChange: (a: RowAction) => void;
  isDuplicate: boolean;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as RowAction)}
      className="text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-400"
    >
      {isDuplicate && <option value="update">Update existing</option>}
      {isDuplicate && <option value="create">Create new anyway</option>}
      {!isDuplicate && <option value="create">Create</option>}
      <option value="skip">Skip</option>
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BulkUpload() {
  const [mode, setMode] = useState<UploadMode>("items");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [itemRows, setItemRows] = useState<ItemRow[]>([]);
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>([]);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Template download ──────────────────────────────────────────────────────

  const downloadTemplate = async () => {
    const res = await api.get(`/bulk/${mode}/template`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}_template.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Preview ────────────────────────────────────────────────────────────────

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/bulk/${mode}/preview`, formData);
      const data = res.data;
      setSummary({ total: data.total, new_count: data.new_count, duplicate_count: data.duplicate_count, error_count: data.error_count });

      if (mode === "items") {
        setItemRows(data.rows.map((r: ItemRow) => ({
          ...r,
          action: r.status === "new" ? "create" : r.status === "duplicate" ? "update" : "skip",
        })));
      } else {
        setCompanyRows(data.rows.map((r: CompanyRow) => ({
          ...r,
          action: r.status === "new" ? "create" : r.status === "duplicate" ? "update" : "skip",
        })));
      }
      setStep("preview");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm ────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = mode === "items"
        ? { rows: itemRows.filter(r => r.status !== "error").map(r => ({ ...r, action: r.action ?? "skip" })) }
        : { rows: companyRows.filter(r => r.status !== "error").map(r => ({ ...r, action: r.action ?? "skip" })) };

      const res = await api.post(`/bulk/${mode}/confirm`, payload);
      setResult(res.data);
      setStep("done");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Confirm failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Bulk action setters ────────────────────────────────────────────────────

  const setAllDuplicates = (action: RowAction) => {
    if (mode === "items") {
      setItemRows(prev => prev.map(r => r.status === "duplicate" ? { ...r, action } : r));
    } else {
      setCompanyRows(prev => prev.map(r => r.status === "duplicate" ? { ...r, action } : r));
    }
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setSummary(null);
    setItemRows([]);
    setCompanyRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Counts for confirm button ──────────────────────────────────────────────
  const activeRows = mode === "items"
    ? itemRows.filter(r => r.action !== "skip" && r.status !== "error")
    : companyRows.filter(r => r.action !== "skip" && r.status !== "error");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageContainer title="Bulk Upload">

      {/* Mode selector */}
      <div className="flex gap-3 mb-6">
        {(["items", "companies"] as UploadMode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); reset(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              mode === m
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="p-5 border border-dashed border-gray-300 rounded-xl bg-gray-50 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Step 1 — Download the template</p>
              <Button type="button" variant="ghost" onClick={downloadTemplate}>
                ⬇ Download {mode} template (.xlsx)
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Step 2 — Fill it in and upload</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="block text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700 file:cursor-pointer hover:file:bg-slate-200"
              />
            </div>

            {file && (
              <p className="text-xs text-gray-500">
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handlePreview}
            disabled={!file || loading}
          >
            {loading ? "Analysing..." : "Preview upload →"}
          </Button>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === "preview" && summary && (
        <div className="space-y-5">

          {/* Summary bar */}
          <div className="flex flex-wrap gap-4 p-4 bg-white border border-gray-200 rounded-xl text-sm">
            <span className="text-gray-500">Total rows: <strong>{summary.total}</strong></span>
            <span className="text-emerald-600">New: <strong>{summary.new_count}</strong></span>
            <span className="text-amber-600">Duplicates: <strong>{summary.duplicate_count}</strong></span>
            <span className="text-red-500">Errors: <strong>{summary.error_count}</strong></span>
          </div>

          {/* Duplicate bulk actions */}
          {summary.duplicate_count > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">Set all duplicates to:</span>
              <Button type="button" variant="ghost" onClick={() => setAllDuplicates("update")}>
                Update all
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAllDuplicates("skip")}>
                Skip all
              </Button>
            </div>
          )}

          {/* Preview table — Items */}
          {mode === "items" && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Cat. Nr</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Manufacturer</th>
                    <th className="px-3 py-2 text-left">Supplier</th>
                    <th className="px-3 py-2 text-left">Tags</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map(r => (
                    <tr
                      key={r.row}
                      className={`border-t border-gray-100 ${r.status === "error" ? "bg-red-50" : r.action === "skip" ? "opacity-40" : ""}`}
                    >
                      <td className="px-3 py-2 text-gray-400">{r.row}</td>
                      <td className="px-3 py-2">
                        {r.status === "error"
                          ? <span className="text-xs text-red-600" title={r.error}>⚠ {r.error}</span>
                          : <StatusBadge status={r.status} />
                        }
                      </td>
                      <td className="px-3 py-2 font-medium max-w-[160px] truncate">{r.name}</td>
                      <td className="px-3 py-2 text-gray-500">{r.catalogue_nr}</td>
                      <td className="px-3 py-2 text-gray-500">{r.unit}</td>
                      <td className="px-3 py-2 text-gray-500">{r.category}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{r.manufacturer}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{r.supplier}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{r.tags}</td>
                      <td className="px-3 py-2">
                        {r.status !== "error" && (
                          <ActionSelect
                            value={r.action ?? "skip"}
                            isDuplicate={r.status === "duplicate"}
                            onChange={action =>
                              setItemRows(prev => prev.map(x => x.row === r.row ? { ...x, action } : x))
                            }
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Preview table — Companies */}
          {mode === "companies" && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 text-sm">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Supplier</th>
                    <th className="px-3 py-2 text-left">Manufacturer</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {companyRows.map(r => (
                    <tr
                      key={r.row}
                      className={`border-t border-gray-100 ${r.status === "error" ? "bg-red-50" : r.action === "skip" ? "opacity-40" : ""}`}
                    >
                      <td className="px-3 py-2 text-gray-400">{r.row}</td>
                      <td className="px-3 py-2">
                        {r.status === "error"
                          ? <span className="text-xs text-red-600" title={r.error}>⚠ {r.error}</span>
                          : <StatusBadge status={r.status} />
                        }
                      </td>
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-gray-500">{r.email}</td>
                      <td className="px-3 py-2 text-gray-500">{r.phone}</td>
                      <td className="px-3 py-2 text-center">{r.is_supplier ? "✓" : ""}</td>
                      <td className="px-3 py-2 text-center">{r.is_manufacturer ? "✓" : ""}</td>
                      <td className="px-3 py-2">
                        {r.status !== "error" && (
                          <ActionSelect
                            value={r.action ?? "skip"}
                            isDuplicate={r.status === "duplicate"}
                            onChange={action =>
                              setCompanyRows(prev => prev.map(x => x.row === r.row ? { ...x, action } : x))
                            }
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="primary" onClick={handleConfirm} disabled={loading || activeRows.length === 0}>
              {loading ? "Importing..." : `Confirm import (${activeRows.length} rows)`}
            </Button>
            <Button variant="ghost" type="button" onClick={reset}>
              ← Start over
            </Button>
            {summary.error_count > 0 && (
              <p className="text-xs text-red-500">
                {summary.error_count} rows with errors will be skipped automatically.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === "done" && result && (
        <div className="space-y-4">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
            <h3 className="font-semibold text-emerald-800 mb-3">Import complete</h3>
            <div className="flex gap-8 text-sm">
              <div><span className="text-gray-500">Created</span><br /><strong className="text-2xl text-emerald-700">{result.created}</strong></div>
              <div><span className="text-gray-500">Updated</span><br /><strong className="text-2xl text-amber-600">{result.updated}</strong></div>
              <div><span className="text-gray-500">Skipped</span><br /><strong className="text-2xl text-gray-400">{result.skipped}</strong></div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-700 mb-2">Errors during import:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}

          <Button variant="ghost" onClick={reset}>Upload another file</Button>
        </div>
      )}
    </PageContainer>
  );
}
