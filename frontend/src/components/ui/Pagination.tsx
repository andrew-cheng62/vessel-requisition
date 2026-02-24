import Button from "./Button";

type Props = {
  page: number;
  pages: number;
  onChange: (page: number) => void;
};

export default function Pagination({
  page,
  pages,
  onChange,
}: Props) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <Button
        variant="primary"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </Button>

      <span className="text-sm text-gray-600">
        Page {page} of {pages}
      </span>

      <Button
        variant="primary"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </Button>
    </div>
  );
}
