import { useState } from "react";
import api from "../../api/api";
import type { RequisitionItem, Requisition } from "../../types";
import toast from "react-hot-toast";

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
 //   <div className="modal-backdrop">
 //     <div className="modal">
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>

        <h3>Receive item</h3>

        <p>
          <strong>{item.item.name}</strong>
        </p>

        <p>Remaining: {remaining}</p>

        <input
          type="number"
          min={1}
          max={remaining}
          value={qty}
          onChange={e => setQty(Number(e.target.value))}
          disabled={loading}
        />

        <div style={{ marginTop: 16 }}>
          <button onClick={submit} disabled={loading}>
            Confirm
          </button>
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
//    </div>
  );
}
