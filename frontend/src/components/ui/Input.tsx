import clsx from "clsx"

export default function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500",
        "transition",
        className
      )}
      {...props}
    />
  )
}

