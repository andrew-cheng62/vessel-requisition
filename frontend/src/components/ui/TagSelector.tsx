import { useState } from "react";
import type { Tag } from "../../types";
import TagBadge from "./TagBadge";

type Props = {
  allTags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
};

export default function TagSelector({ allTags, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selectedTags = allTags.filter(t => selectedIds.includes(t.id));
  const unselectedTags = allTags.filter(t => !selectedIds.includes(t.id));

  const add = (id: number) => onChange([...selectedIds, id]);
  const remove = (id: number) => onChange(selectedIds.filter(i => i !== id));

  return (
    <div>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 min-h-[28px] mb-2">
        {selectedTags.map(tag => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => remove(tag.id)} />
        ))}
        {selectedTags.length === 0 && (
          <span className="text-sm text-gray-400">No tags selected</span>
        )}
      </div>

      {/* Dropdown toggle */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-sm text-sky-600 hover:underline"
      >
        {open ? "▲ Close" : "▼ Add tags"}
      </button>

      {/* Available tags */}
      {open && (
        <div className="mt-2 flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {unselectedTags.length === 0 && (
            <span className="text-sm text-gray-400">All tags selected</span>
          )}
          {unselectedTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => add(tag.id)}
              className="px-2 py-0.5 rounded-full text-xs font-medium border hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: tag.color + "22",
                color: tag.color,
                borderColor: tag.color + "66",
              }}
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
