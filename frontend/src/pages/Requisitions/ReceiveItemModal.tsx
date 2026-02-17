import { useState } from "react";
import api from "../../api/api";
import type { RequisitionItem, Requisition } from "../../types";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import styles from "../../styles/Modal.module.css";

type Props = {
  requisitionId: number;
  item: RequisitionItem;
  onClose: () => void;
  onSuccess: (req: Requisition) => void;
};

export default function ReceiveItemModal({
  requisitionId,
  item,
  onClose,
  onSuccess,
}: Props) {
  const remaining = item.quantity - item.received_qty;
  const [qty, setQty] = useState(remaining);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (qty <= 0 || qty > remaining) return;

    setLoading(true);

    try {
      const res = await api.post(
        `/requisitions/${requisitionId}/items/${item.id}/receive`,
        { quantity: qty }
      );

      onSuccess(res.data);
      toast.success("Items received");
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Receive failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.title}>Receive Item</div>

        <div className={styles.section}>
          <div className="font-medium">{item.item.name}</div>
          <div className={styles.metaText}>
            Remaining: {remaining}
          </div>
        </div>

        <div className={styles.section}>
          <Input
            type="number"
            min={1}
            max={remaining}
            value={qty}
            onChange={e => setQty(Number(e.target.value))}
            disabled={loading}
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
