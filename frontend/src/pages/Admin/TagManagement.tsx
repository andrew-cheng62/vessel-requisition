import { useEffect, useState } from "react";
import { fetchTags, createTag, updateTag, deleteTag } from "../../api/api";
import type { Tag } from "../../types";
import PageContainer from "../../components/layout/PageContainer";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import TagBadge from "../../components/ui/TagBadge";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  "#6b7280", // gray
  "#10b981", // green
  "#3b82f6", // blue
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#06b6d4", // cyan
];

type EditingTag = { name: string; color: string };
const EMPTY: EditingTag = { name: "", color: "#6b7280" };

export default function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<EditingTag>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTags()
      .then(setTags)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, color: tag.color });
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTag(editingId, form);
        toast.success("Tag updated");
      } else {
        await createTag(form);
        toast.success("Tag created");
      }
      cancelForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save tag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all items.`)) return;
    try {
      await deleteTag(tag.id);
      toast.success("Tag deleted");
      setTags(prev => prev.filter(t => t.id !== tag.id));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete tag");
    }
  };

  return (
    <PageContainer
      title="Tag Management"
      actions={
        !showForm ? (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            + New Tag
          </Button>
        ) : null
      }
    >

      {/* Create / Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
        >
          <h3 className="font-semibold text-gray-800">
            {editingId ? "Edit Tag" : "New Tag"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Consumable"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              {/* Preset swatches */}
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: form.color === color ? "#1e293b" : "transparent",
                    }}
                    title={color}
                  />
                ))}
                {/* Custom color picker */}
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                  title="Custom color"
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          {form.name && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Preview:</span>
              <TagBadge tag={{ id: 0, name: form.name, slug: "", color: form.color }} />
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save changes" : "Create tag"}
            </Button>
            <Button type="button" variant="ghost" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Tags table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-gray-500">No tags yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tag</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Color</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tags.map(tag => (
                <tr key={tag.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <TagBadge tag={tag} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-gray-500 font-mono text-xs">{tag.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" onClick={() => startEdit(tag)}>
                      Edit
                    </Button>
                    <Button variant="delete" onClick={() => handleDelete(tag)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
