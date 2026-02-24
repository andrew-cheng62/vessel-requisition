import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import PageCard from "../../components/layout/PageCard/PageCard";
import styles from "../../styles/ItemDetails.module.css";
import type { Item } from "../../types";
import Button from "../../components/ui/Button";

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    api.get(`/items/${id}`).then(res => setItem(res.data));
  }, [id]);

  if (!item) return <p>Loading…</p>;

  return (
    <PageCard>
      <div className={styles.layout}>
        {/* IMAGE */}
        <div className={styles.imageBox}>
          {item.image_path ? (
            <img
              src={`http://localhost:8000/${item.image_path}`}
              className={styles.image}
              alt={item.name}
            />
          ) : (
            "No image"
          )}
        </div>

        {/* DETAILS */}
        <div>
          <h2 className={styles.title}>{item.name}</h2>
          <p>{item.desc_short || ""}</p>

          <table className={styles.metaTable}>
            <tbody>
              <tr>
                <td><strong>Catalogue Nr</strong></td>
                <td>{item.catalogue_nr || "—"}</td>
              </tr>
              <tr>
                <td><strong>Unit</strong></td>
                <td>{item.unit}</td>
              </tr>
              <tr>
                <td><strong>Category</strong></td>
                <td>{item.category?.name ?? "—"}</td>
              </tr>
              <tr>
                <td><strong>Manufacturer</strong></td>
                <td>{item.manufacturer?.name ?? "—"}</td>
              </tr>
              <tr>
                <td><strong>Supplier</strong></td>
                <td>{item.supplier?.name ?? "—"}</td>
              </tr>
            </tbody>
          </table>

          <p>{item.desc_long || ""}</p>

          <div className={styles.actions}>
            <Link to={`/requisitions/new?itemId=${item.id}`}>
              <Button variant="secondary">
                Order
              </Button>
            </Link>

            <Link to={`/items/${item.id}/edit`}>
              <Button variant="ghost">Edit</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageCard>
  );
}
