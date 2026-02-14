import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import type { Requisition, RequisitionItem } from "../../types";
import PageCard from "../../components/PageCard/PageCard";
import StatusActions from "./StatusActions";
import ReceiveItemModal from "./ReceiveItemModal";
import styles from "./RequisitionDetails.module.css";

export default function RequisitionDetails() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<Requisition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiveItem, setReceiveItem] = useState<RequisitionItem | null>(null);

  const loadRequisition = () => {
    api
      .get(`/requisitions/${id}`)
      .then(res => setReq(res.data))
      .catch(() => setError("Failed to load requisition"));
  };

  useEffect(() => {
    loadRequisition();
  }, [id]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!req) return <p>Loading…</p>;

  return (
    <PageCard>
      <div className={styles.layout}>
        {/* LEFT COLUMN */}
        <div className={styles.sideBox}>
          <div className={styles.status}>
            Status: {req.status}
          </div>

          <div className={styles.meta}>
            <p>
              <strong>Created:</strong><br />
              {new Date(req.created_at).toLocaleString()}
            </p>

            {req.supplier && (
              <p>
                <strong>Supplier:</strong><br />
                <Link to={`/companies/${req.supplier.id}`}>
                  {req.supplier.name}
                </Link>
              </p>
            )}

            {req.notes && (
              <p>
                <strong>Notes:</strong><br />
                {req.notes}
              </p>
            )}
          </div>

          {/* STATUS CONTROLS */}
          <StatusActions
            req={req}
            setReq={setReq}
            onChange={loadRequisition}
          />
        </div>

        {/* MAIN COLUMN */}
        <div className={styles.main}>
          <h2>Requisition #{req.id}</h2>

          {/* ITEMS */}
          <h3>Items</h3>

          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th align="left">Item</th>
                <th>Unit</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Remaining</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {req.items
                .filter(line => line.item)
                .map(line => {
                  const remaining =
                    line.quantity - line.received_qty;

                  return (
                    <tr key={line.id}>
                      <td>
                        <Link to={`/items/${line.item.id}`}>
                          {line.item.name}
                        </Link>
                      </td>

                      <td align="center">{line.item.unit}</td>
                      <td align="center">{line.quantity}</td>
                      <td align="center">{line.received_qty}</td>
                      <td align="center">{remaining}</td>

                      <td>
                        {["ordered", "partially_received"].includes(
                          req.status
                        ) && (
                          <button
                            disabled={remaining <= 0}
                            onClick={() => setReceiveItem(line)}
                            style={{
                              opacity: remaining <= 0 ? 0.5 : 1,
                            }}
                          >
                            📦 Receive
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* ACTIONS */}
          {req.status === "draft" && (
            <div className={styles.actions}>
              <Link to={`/requisitions/${req.id}/edit`}>
                <button>✏️ Edit requisition</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {receiveItem && (
        <ReceiveItemModal
          requisitionId={req.id}
          item={receiveItem}
          onClose={() => setReceiveItem(null)}
          onSuccess={loadRequisition}
        />
      )}
    </PageCard>
  );
}
