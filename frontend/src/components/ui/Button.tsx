import clsx from "clsx"


type Variant = "primary" | "secondary" | "danger" | "ghost" | "delete"

export default function Button({
  children,
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          primary:
            "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-400 cursor-pointer",
          secondary:
            "bg-yellow-300 text-gray-800 hover:bg-yellow-200 focus:ring-yellow-500 cursor-pointer",
          danger:
            "bg-red-600 text-white hover:bg-red-400 focus:ring-red-800 cursor-pointer",
          ghost:
            "bg-transparent text-gray-800 hover:bg-gray-300 cursor-pointer",
          delete:
            "bg-transparent text-red-800 hover:bg-red-200 cursor-pointer",
        }[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
