import clsx from "clsx";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export default function Select({ className, ...props }: Props) {
  return (
    <select
      className={clsx(
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
        className
      )}
      {...props}
    />
  );
}
