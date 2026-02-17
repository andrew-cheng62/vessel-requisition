import styles from "./PageCard.module.css";

export default function PageCard({ children }: { children: React.ReactNode }) {
  return <div className={styles.card}>{children}</div>;
}
