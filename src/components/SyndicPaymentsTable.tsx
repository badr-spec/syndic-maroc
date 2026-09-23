"use client";

import { useState } from "react";

type Payment = {
  id: string;
  transaction_id: string | null;
  amount: number;
  status: "pending" | "declared" | "paid" | "rejected";
  resident_nom: string;
  apartment_number: string;
  paid_at?: string | null;
};

const statusLabel: Record<Payment["status"], string> = {
  pending: "Non payé",
  declared: "Déclaré par le résident",
  paid: "Payé",
  rejected: "Rejeté",
};

export default function SyndicPaymentsTable({
  payments,
  onRefresh,
}: {
  payments: Payment[];
  onRefresh: () => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleConfirm(id: string, action: "confirmer" | "rejeter") {
    setLoadingId(id);
    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: id, action }),
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
              <span className={`badge badge-${p.status}`}>
                {statusLabel[p.status]}
              </span>
            </td>
            <td>
              {p.status === "declared" && (
                <div className="row">
                  <button
                    disabled={loadingId === p.id}
                    onClick={() => handleConfirm(p.id, "confirmer")}
                  >
                    Confirmer
                  </button>
                  <button
                    disabled={loadingId === p.id}
                    onClick={() => handleConfirm(p.id, "rejeter")}
                  >
                    Rejeter
                  </button>
                </div>
              )}
              {p.status === "paid" && p.paid_at && (
                <span className="muted">
                  {new Date(p.paid_at).toLocaleDateString("fr-FR")}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
