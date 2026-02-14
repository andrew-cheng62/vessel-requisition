import clsx from "clsx"


type Variant = "primary" | "secondary" | "danger" | "ghost"

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
            "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-400",
          secondary:
            "bg-yellow-200 text-gray-800 hover:bg-yellow-300 focus:ring-yellow-500",
          danger:
            "bg-red-200 text-gray-800 hover:bg-red-300 focus:ring-red-500",
          ghost:
            "bg-transparent text-gray-800 hover:bg-gray-300",
        }[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
