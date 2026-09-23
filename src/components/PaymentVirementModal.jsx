import { useState } from "react";

export default function PaymentVirementModal({
  paymentId,
  residentId,
  chargeTitle,
  montant,
  rib,
  beneficiaire,
  reference,
  onClose,
  onDeclared,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
  }

  async function handleDeclare() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/declare-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, resident_id: residentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onDeclared();
      onClose();
    } catch (e) {
      setError(e.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Payer par virement</h3>
          <button onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <p className="modal-subtitle">{chargeTitle} · {montant} DH</p>

        <div className="info-block">
          <span className="label">Bénéficiaire</span>
          <span>{beneficiaire}</span>
        </div>

        <div className="info-block">
          <span className="label">RIB</span>
          <div className="row">
            <span className="mono">{rib}</span>
            <button onClick={() => copyToClipboard(rib)}>Copier</button>
          </div>
        </div>

        <div className="info-block accent">
          <span className="label">Référence à indiquer</span>
          <div className="row">
            <span className="mono">{reference}</span>
            <button onClick={() => copyToClipboard(reference)}>Copier</button>
          </div>
        </div>

        <p className="hint">
          Indiquez cette référence lors du virement pour que le syndic
          puisse identifier votre paiement.
        </p>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" onClick={handleDeclare} disabled={loading}>
          {loading ? "Envoi…" : "J'ai effectué le virement"}
        </button>
      </div>
    </div>
  );
}
