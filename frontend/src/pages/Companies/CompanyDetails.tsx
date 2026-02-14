import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/api";
import PageCard from "../../components/PageCard/PageCard";
import styles from "./CompanyDetails.module.css";
import type { Company } from "../../types";

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    api.get(`/companies/${id}`).then(res => setCompany(res.data));
  }, [id]);

  if (!company) return <p>Loading…</p>;

  return (
    <PageCard>
      <div className={styles.layout}>
        {/* LOGO */}
        <div className={styles.logoBox}>
          {company.logo_path ? (
            <img
              src={`http://localhost:8000/${company.logo_path}`}
              alt={company.name}
              className={styles.logo}
            />
          ) : (
            "No logo"
          )}
        </div>

        {/* DETAILS */}
        <div>
          <h2 className={styles.title}>{company.name}</h2>

          {company.comments && <p>{company.comments}</p>}

          <table className={styles.metaTable}>
            <tbody>
              <tr>
                <td><strong>Type</strong></td>
                <td>
                  {company.is_supplier && "Supplier "}
                  {company.is_manufacturer && "Manufacturer"}
                </td>
              </tr>

              <tr>
                <td><strong>Email</strong></td>
                <td>{company.email || "—"}</td>
              </tr>

              <tr>
                <td><strong>Phone</strong></td>
                <td>{company.phone || "—"}</td>
              </tr>

              <tr>
                <td><strong>Website</strong></td>
                <td>
                  {company.website ? (
                    <a href={company.website} target="_blank">
                      {company.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>

            </tbody>
          </table>

          <div className={styles.actions}>
            <Link to={`/companies/${company.id}/edit`}>
              <button>Edit</button>
            </Link>

            {company.is_supplier && (
              <Link to={`/requisitions/new?supplier_id=${company.id}`}>
                <button>Create requisition</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageCard>
  );
}
