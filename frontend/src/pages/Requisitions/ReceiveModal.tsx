import { useState } from "react";
import api from "../../api/api";
import type { Requisition, RequisitionItem } from "../../types";
import toast from "react-hot-toast";
import ReceiveRow from "./ReceiveRow";
import Button from "../../components/ui/Button";
import styles from "../../styles/Modal.module.css";

type Props = {
  requisition: Requisition;
  onClose: () => void;
  onUpdated: (req: Requisition) => void;
};

export default function ReceiveModal({
  requisition,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const receivableItems = requisition.items.filter(
    i => i.received_qty < i.quantity
  );

  const receive = async (item: RequisitionItem, qty: number) => {
    if (qty <= 0) return;

    setLoading(true);

    try {
      const res = await api.post(
        `/requisitions/${requisition.id}/items/${item.id}/receive`,
        { quantity: qty }
      );

      onUpdated(res.data);
      toast.success("Items received");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to receive items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.title}>Receive Items</div>

        {receivableItems.length === 0 && (
          <div className={styles.metaText}>
            All items already received.
          </div>
        )}

        {receivableItems.map(item => {
          const remaining = item.quantity - item.received_qty;

          return (
            <ReceiveRow
              key={item.id}
              item={item}
              remaining={remaining}
              onReceive={qty => receive(item, qty)}
              disabled={loading}
            />
          );
        })}

        <div className={styles.actions}>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
