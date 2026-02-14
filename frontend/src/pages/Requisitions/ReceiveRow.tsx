import { useState } from "react";
import type { RequisitionItem } from "../../types";

type Props = {
  item: RequisitionItem;
  remaining: number;
  onReceive: (qty: number) => void;
  disabled?: boolean;
};

export default function ReceiveRow({
  item,
  remaining,
  onReceive,
  disabled,
}: Props) {
  const [qty, setQty] = useState(remaining);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <strong style={{ flex: 1 }}>
        {item.item.name}
      </strong>

      <span>
        {remaining} {item.item.unit} remaining
      </span>

      <input
        type="number"
        min={1}
        max={remaining}
        value={qty}
        onChange={e => setQty(Number(e.target.value))}
        style={{ width: 80 }}
        disabled={disabled}
      />

      <button
        onClick={() => onReceive(qty)}
        disabled={disabled || qty <= 0 || qty > remaining}
      >
        Receive
      </button>
    </div>
  );
}
