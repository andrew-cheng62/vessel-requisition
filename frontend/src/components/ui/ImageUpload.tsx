export function ImageUpload(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="file"
      accept="image/*"
      className="block w-full text-sm text-gray-600
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-lg file:border-0
                 file:text-sm file:font-medium
                 file:bg-indigo-50 file:text-indigo-700
                 hover:file:bg-indigo-100"
      {...props}
    />
  )
}