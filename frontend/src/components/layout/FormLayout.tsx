type Props = {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
};

export function FormLayout({ children, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {children}
    </form>
  );
}

export function FormField({
  label,
  children,
}: {
  // FIX: label was required but used without it in several places (e.g. checkbox rows)
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
