import api from "../../api/api";
import toast from "react-hot-toast";
import type { Requisition } from "../../types";
import styles from "./StatusActions.module.css";

type Props = {
  req: Requisition;
  setReq: (r: Requisition) => void;
  onChange?: () => void;
};

export default function StatusActions({ req, setReq, onChange }: Props) {
  const STATUS_FLOW: Record<string, string[]> = {
    draft: ["rfq_sent", "cancelled"],
    rfq_sent: ["ordered", "cancelled"],
    ordered: [],
    partially_received: [],
  };

  const allowed = STATUS_FLOW[req.status] || [];

  const changeStatus = async (status: string) => {
    const prevStatus = req.status;
    setReq({ ...req, status });

    try {
      await api.post(`/requisitions/${req.id}/status`, { status });
      toast.success(`Status set to ${status}`);
      onChange?.();
    } catch {
      setReq({ ...req, status: prevStatus });
      toast.error("Status change failed");
    }
  };

  if (!allowed.length) return null;

  return (
    <div className={styles.container}>
      {allowed.map(s => (
        <button
          key={s}
          onClick={() => changeStatus(s)}
          className={`${styles.actionBtn} ${styles[`status_${s}`]}`}
        >
          {s.replace("_", " ").toUpperCase()}
        </button>
      ))}
    </div>
  );
}
