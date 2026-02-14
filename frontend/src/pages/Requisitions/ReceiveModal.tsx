import { useState } from "react";
import api from "../../api/api";
import type { Requisition, RequisitionItem } from "../../types";
import toast from "react-hot-toast";
import ReceiveRow from "./ReceiveRow";

type Props = {
  requisition: Requisition;
  onClose: () => void;
  onUpdated: () => void;
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
        { quantity: qty}
     );

      onUpdated(res.data); // backend is source of truth
      toast.success("Items received");
      onClose();

      
    } catch (err: any) {
      toast.error(err.responce?.data?.detail || "Failed to receive items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Receive items</h3>

        {receivableItems.length === 0 && (
          <p>All items already received.</p>
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

        <div style={{ marginTop: 16 }}>
          <button onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
