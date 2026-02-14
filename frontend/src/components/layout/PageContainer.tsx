export default function PageContainer({
  title,
  actions,
  children,
}: {
  title?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {(title || actions) && (
          <div className="flex items-center justify-between mb-8">
            {title && (
              <h1 className="text-2xl font-semibold text-gray-900">
                {title}
              </h1>
            )}
            {actions}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
