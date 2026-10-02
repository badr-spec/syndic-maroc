import React from 'react'

export default function PaymentReceiptModal({ payment, resident, charge, residence, onClose }) {
  if (!payment || !resident) return null

  const receiptNumber = `REC-${new Date(payment.paid_at || payment.created_at || Date.now()).getFullYear()}-${String(payment.id).slice(-4).toUpperCase()}`
  const formattedDate = new Date(payment.paid_at || payment.created_at || Date.now()).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  function handlePrint() {
    window.print()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '680px',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
            Aperçu du Reçu Officiel · {receiptNumber}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#047857',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={handlePrint}
            >
              🖨️ Imprimer / PDF
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={onClose}
            >
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" style={{
          padding: '32px',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #047857',
            paddingBottom: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ margin: 0, color: '#047857', fontSize: '1.4rem', fontWeight: 800 }}>
                {residence?.name || 'Copropriété Al Andalous'}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Syndic de Copropriété · Loi n° 18-00 relative à la copropriété
              </p>
              <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                {residence?.address || 'Casablanca, Maroc'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                borderRadius: '6px',
                padding: '6px 12px',
                display: 'inline-block',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {receiptNumber}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Date : {formattedDate}
              </p>
            </div>
          </div>

          {/* Receipt Title */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: '#0f172a',
              textTransform: 'uppercase'
            }}>
              Reçu de Règlement de Cotisation
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Attestation libératoire de charges de copropriété
            </p>
          </div>

          {/* Resident & Property Info Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '0.9rem'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Copropriétaire / Résident</span>
              <strong style={{ color: '#0f172a' }}>{resident?.full_name}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>N° d'Appartement</span>
              <strong style={{ color: '#0f172a' }}>{resident?.apartment_number || 'B-14'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Téléphone</span>
              <strong style={{ color: '#0f172a' }}>{resident?.phone || '—'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Statut de l'encaissement</span>
              <span style={{ color: '#047857', fontWeight: 700 }}>✅ Validé & Encaissé</span>
            </div>
          </div>

          {/* Payment Detail Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#334155' }}>Désignation de la Charge</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: '#334155' }}>Mode de règlement</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#334155' }}>Montant Réglé</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>
                  <strong>{charge?.title || payment.note || 'Cotisation de copropriété'}</strong>
                  {payment.note && payment.note !== charge?.title && (
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
                      Réf: {payment.note}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', padding: '12px', color: '#475569' }}>
                  Virement bancaire / Encaissé
                </td>
                <td style={{ textAlign: 'right', padding: '12px', fontWeight: 800, color: '#047857', fontSize: '1.05rem' }}>
                  {payment.amount} MAD
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan="2" style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>
                  TOTAL RÉGLÉ EN COMPTE SYNDIC :
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#047857', fontSize: '1.15rem' }}>
                  {payment.amount} MAD
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signature & Stamp Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '30px',
            paddingTop: '16px',
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '320px', lineHeight: 1.4 }}>
              Ce document est généré électroniquement et vaut quittance libératoire pour les montants ci-dessus spécifiés sous réserve d'encaissement définitif.
            </div>
            <div style={{
              textAlign: 'center',
              border: '2px dashed #047857',
              borderRadius: '8px',
              padding: '12px 20px',
              background: '#f0fdf4'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                Cachet Électronique Syndic
              </span>
              <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.95rem' }}>
                ACQUITTÉ & VALIDÉ
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
