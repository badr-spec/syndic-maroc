import { useState } from 'react'

const TEMPLATES = [
  {
    id: 'amical',
    label: '🟢 1er Rappel amical (Début de mois)',
    buildMessage: (r, c, b) =>
      `Salam ${r.full_name || 'cher copropriétaire'},\n\nJ'espère que vous allez bien. Petit rappel amical du syndic concernant la cotisation mensuelle : "${c.title}" pour votre appartement n° ${r.apartment_number || '—'}.\n\n💵 Montant : ${c.amount} DH\n📅 Échéance : ${new Date(c.due_date).toLocaleDateString('fr-FR')}\n🏦 RIB : ${b.rib || 'Disponible auprès du syndic'}\n\nMerci infiniment pour votre ponctualité pour l'entretien de notre résidence ! 🙏`
  },
  {
    id: 'echeance',
    label: '🟠 2ème Rappel d’échéance dépassée',
    buildMessage: (r, c, b) =>
      `Bonjour M./Mme ${r.full_name || 'le copropriétaire'},\n\nSauf erreur ou virement en cours de traitement, la cotisation "${c.title}" d'un montant de ${c.amount} DH pour l'appartement ${r.apartment_number || '—'} est arrivée à échéance le ${new Date(c.due_date).toLocaleDateString('fr-FR')}.\n\nNous vous prions de bien vouloir procéder au règlement (par virement ou chèque) afin de nous permettre d'honorer les factures des prestataires (nettoyage, électricité, ascenseur).\n\nBien cordialement,\nLe Syndic.`
  },
  {
    id: 'mise_en_demeure',
    label: '🔴 Mise en demeure formelle (Art. 25 Loi 18-00)',
    buildMessage: (r, c, b) =>
      `AVIS FORMEL DU SYNDICAT DES COPROPRIÉTAIRES\nÀ l'attention de M./Mme ${r.full_name} (Apt ${r.apartment_number})\n\nMalgré nos relances amiables, votre compte copropriétaire présente à ce jour un solde débiteur impayé pour la charge "${c.title}" (${c.amount} DH).\n\nConformément aux dispositions de la Loi 18-00 relative au statut de la copropriété, nous vous mettons en demeure de régulariser cet arriéré sous un délai de 8 jours.\n\nÀ défaut, le syndicat se réserve le droit d'engager les procédures de recouvrement forcé prévues par la loi.\n\nLe Syndic de copropriété.`
  },
  {
    id: 'remerciement',
    label: '👏 Message de remerciement aux payeurs',
    buildMessage: (r, c, b) =>
      `Salam ${r.full_name},\n\nLe bureau du syndic vous remercie chaleureusement pour le règlement ponctuel de votre cotisation (${c.amount} DH). Votre reçu de paiement officiel est disponible sur l'application Syndic Maroc.\n\nBonne journée ! ✨`
  }
]

export default function GroupWhatsAppRelanceModal({ charge, unpaidResidents, residence, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('amical')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [copiedGroupBroadcast, setCopiedGroupBroadcast] = useState(false)

  const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0]

  function openWhatsApp(resident) {
    const rawPhone = (resident.phone || '').replace(/[^0-9]/g, '')
    const phone = rawPhone.startsWith('0') ? '212' + rawPhone.slice(1) : rawPhone || '212600000000'
    const text = template.buildMessage(resident, charge, residence || {})
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  function copyText(resident, index) {
    const text = template.buildMessage(resident, charge, residence || {})
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1800)
  }

  // Group broadcast text for the whole WhatsApp group
  const groupBroadcastText = `📢 ANNONCE DU SYNDIC — RAPPEL COTISATIONS "${charge.title}"\n\nChers voisins et copropriétaires,\n\nNous rappelons à l'ensemble des résidents que l'appel de fonds mensuel (${charge.amount} DH) est arrivé à échéance le ${new Date(charge.due_date).toLocaleDateString('fr-FR')}.\n\nMerci à tous ceux qui ont déjà réglé. Pour les résidents ayant un paiement en attente, nous vous remercions de bien vouloir régulariser afin d'assurer la continuité des services (ascenseur, nettoyage, sécurité).\n\n🏦 RIB : ${residence?.rib || 'Disponible sur l\'application'}\n\nBonne semaine à tous ! 🤝`

  function copyGroupBroadcast() {
    navigator.clipboard.writeText(groupBroadcastText)
    setCopiedGroupBroadcast(true)
    setTimeout(() => setCopiedGroupBroadcast(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 210,
      padding: '16px'
    }}>
      <div className="card" style={{
        background: '#ffffff',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '14px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
              📢 Relances WhatsApp Groupées des Impayés
            </h3>
            <p className="muted small" style={{ margin: '2px 0 0 0' }}>
              Charge : <strong>{charge.title}</strong> ({charge.amount} DH)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Template Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Choisir le modèle de message WhatsApp :
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tmpl.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: selectedTemplateId === tmpl.id ? 800 : 500,
                  border: selectedTemplateId === tmpl.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  background: selectedTemplateId === tmpl.id ? '#f0fdf4' : '#ffffff',
                  color: selectedTemplateId === tmpl.id ? '#15803d' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Broadcast to Building Group Button */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <strong style={{ fontSize: '0.88rem', display: 'block' }}>
              👥 Message général pour le Groupe WhatsApp de la Résidence
            </strong>
            <span className="small muted" style={{ fontSize: '0.78rem' }}>
              Copiez un texte prêt à coller dans le groupe général pour inviter tout le monde à payer.
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary small"
            onClick={copyGroupBroadcast}
            style={{ whiteSpace: 'nowrap', fontWeight: 700 }}
          >
            {copiedGroupBroadcast ? '✓ Texte copié !' : '📋 Copier le message groupe'}
          </button>
        </div>

        {/* Debtors List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
              Copropriétaires en attente de règlement ({unpaidResidents.length})
            </span>
            <span className="small muted">
              Total à recouvrer : <strong>{unpaidResidents.length * Number(charge.amount)} DH</strong>
            </span>
          </div>

          {unpaidResidents.length === 0 ? (
            <p className="muted small">Félicitations ! Tous les copropriétaires ont réglé cette cotisation.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {unpaidResidents.map((res, idx) => (
                <div
                  key={res.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{res.full_name}</strong>
                    <span className="muted small" style={{ display: 'block', fontSize: '0.75rem' }}>
                      Appartement : <strong>{res.apartment_number || '—'}</strong> · Tél : {res.phone || 'Non renseigné'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => copyText(res, idx)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedIndex === idx ? '✓ Copié' : '📋 Copier'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openWhatsApp(res)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
