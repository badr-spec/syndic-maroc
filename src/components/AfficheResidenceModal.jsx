import { useState } from 'react'

export default function AfficheResidenceModal({ residence, syndicProfile, onClose }) {
  const residenceName = residence?.name || 'Résidence Al Andalous'
  const syndicName = syndicProfile?.full_name || 'Mohammed Benjelloun'
  const syndicPhone = syndicProfile?.phone || '+212 6 61 00 00 00'
  const rib = residence?.rib || '007780000123456789012345'
  const beneficiaire = residence?.beneficiaire || `Syndicat des Copropriétaires ${residenceName}`

  // Clean QR Code leading directly to the app URL
  const appUrl = window.location.origin
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(appUrl)}`

  function handlePrint() {
    window.print()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="card" style={{
        background: '#ffffff',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '14px',
        padding: '30px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
      }}>
        {/* Actions row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a' }}>🖨️ Affiche Officielle pour le Hall d'Entrée & Ascenseurs</h3>
            <span className="muted small">Format A4 prêt à imprimer et plastifier pour l'entrée de la résidence</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Printable Poster Container */}
        <div style={{
          border: '3px solid #064e3b',
          borderRadius: '12px',
          padding: '24px',
          background: '#ffffff',
          textAlign: 'center',
          boxShadow: 'inset 0 0 0 2px #d1fae5'
        }}>
          {/* Top Moroccan Header */}
          <div style={{ borderBottom: '2px solid #064e3b', paddingBottom: '14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#065f46' }}>
              ROYAUME DU MAROC — STATUT DE LA COPROPRIÉTÉ
            </span>
            <h1 style={{ margin: '6px 0 2px 0', fontSize: '1.6rem', color: '#064e3b' }}>
              {residenceName.toUpperCase()}
            </h1>
            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
              Syndicat des Copropriétaires — Informations Officielles
            </span>
          </div>

          {/* QR Code Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: '10px',
            padding: '16px',
            margin: '16px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <strong style={{ fontSize: '1.05rem', color: '#064e3b' }}>
              📲 SCANEZ LE QR CODE AVEC VOTRE TÉLÉPHONE
            </strong>
            <p className="muted small" style={{ margin: 0, maxWidth: '420px', fontSize: '0.82rem' }}>
              Accédez directement à l'application officielle de la résidence : paiement des charges, reçu automatique, signalement des pannes et documents de copropriété.
            </p>

            <img
              src={qrUrl}
              alt="QR Code Entrée Résidence"
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '8px',
                border: '2px solid #064e3b',
                background: '#ffffff',
                padding: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            />

            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46' }}>
              🌐 {appUrl}
            </span>
          </div>

          {/* Contact & Banking Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', textAlign: 'left', marginTop: '16px' }}>
            {/* Syndic Contact */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                📞 CONTACT DU SYNDIC
              </strong>
              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <div><strong>Syndic :</strong> {syndicName}</div>
                <div><strong>Téléphone / WhatsApp :</strong> {syndicPhone}</div>
                <div><strong>Disponibilité :</strong> Du Lundi au Vendredi (9h - 18h)</div>
              </div>
            </div>

            {/* Bank RIB */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                🏦 RÈGLEMENT DES CHARGES (RIB)
              </strong>
              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <div><strong>Bénéficiaire :</strong> {beneficiaire}</div>
                <div><strong>RIB (24 chiffres) :</strong></div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#064e3b', fontSize: '0.82rem' }}>
                  {rib}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Moroccan numbers */}
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#991b1b'
          }}>
            <span>🚑 Protection Civile : 15</span>
            <span>👮 Police Secours : 19</span>
            <span>🚨 Gendarmerie : 177</span>
          </div>

          <div style={{ marginTop: '14px', fontSize: '0.72rem', color: '#64748b' }}>
            Merci de veiller à la tranquillité, à la propreté et au respect du règlement intérieur de notre résidence.
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            style={{ background: '#064e3b', borderColor: '#064e3b', fontWeight: 700 }}
          >
            🖨️ Imprimer l'affiche en A4
          </button>
        </div>
      </div>
    </div>
  )
}
