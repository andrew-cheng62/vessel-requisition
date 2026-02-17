import styles from "../status/StatusActions.module.css";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`${styles.badge} ${styles[`status_${status}`]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
