import { useState } from "react";

const statusLabel = {
  pending: "Non payé",
  declared: "Déclaré par le résident",
  paid: "Payé",
  rejected: "Rejeté",
};

export default function SyndicPaymentsTable({ payments, syndicId, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);

  async function handleAction(paymentId, action) {
    setLoadingId(paymentId);
    try {
      const res = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, action, syndic_id: syndicId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onRefresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <table className="payments-table">
      <thead>
        <tr>
          <th>Résident</th>
          <th>Référence</th>
          <th>Montant</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p.id}>
            <td>{p.resident_nom} · Apt {p.apartment_number}</td>
            <td className="mono">{p.transaction_id ?? "—"}</td>
            <td>{p.amount} DH</td>
            <td>
              <span className={`badge badge-${p.status}`}>{statusLabel[p.status]}</span>
            </td>
            <td>
              {p.status === "declared" && (
                <div className="row">
                  <button disabled={loadingId === p.id} onClick={() => handleAction(p.id, "confirm")}>
                    Confirmer
                  </button>
                  <button disabled={loadingId === p.id} onClick={() => handleAction(p.id, "reject")}>
                    Rejeter
                  </button>
                </div>
              )}
              {p.status === "paid" && p.paid_at && (
                <span className="muted">{new Date(p.paid_at).toLocaleDateString("fr-FR")}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
