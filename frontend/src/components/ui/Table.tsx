export default function Table({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
        {children}
      </table>
    </div>
  )
}
