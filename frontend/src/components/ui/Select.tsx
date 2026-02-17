import clsx from "clsx";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export default function Select({ className, ...props }: Props) {
  return (
    <select
      className={clsx(
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500",
        className
      )}
      {...props}
    />
  );
}
