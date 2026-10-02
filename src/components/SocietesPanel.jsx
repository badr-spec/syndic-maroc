import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { exportToExcel } from '../lib/exportExcel'
import DevisFacturesPanel from './DevisFacturesPanel'

export default function SocietesPanel() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [societes, setSocietes] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .eq('residence_id', profile.residence_id)
      .in('role', ['societe', 'societe_externe'])
      .order('created_at')
    setSocietes(data || [])

    const { data: docsData } = await supabase
      .from('virements')
      .select('*')
      .eq('residence_id', profile.residence_id)
      .in('kind', ['devis', 'facture'])
    setDocs(docsData || [])

    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) load()
  }, [profile])

  async function handleToggleRegle(societeId, isCurrentlyRegle) {
    const newStatus = isCurrentlyRegle ? 'approuve' : 'paye'
    const sDocs = docs.filter(d => d.resident_id === societeId || d.user_id === societeId)
    for (const d of sDocs) {
      await supabase.from('virements').update({ doc_status: newStatus }).eq('id', d.id)
    }
    load()
  }

  function handleExportExcel() {
    const exportData = societes.map(s => {
      const sDocs = docs.filter(d => d.resident_id === s.id || d.user_id === s.id)
      const totalFacture = sDocs.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      const totalPaye = sDocs.filter(d => d.doc_status === 'paye').reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
      const reste = Math.max(0, totalFacture - totalPaye)
      const statusText = totalFacture === 0 ? 'Aucun document' : reste === 0 ? 'Réglé' : 'Non réglé'

      return {
        'Société Prestataire': s.full_name,
        'Téléphone': s.phone || '—',
        'Nombre de documents': sDocs.length,
        'Total Facturé (MAD)': totalFacture,
        'Total Réglé par Syndic (MAD)': totalPaye,
        'Reste à Payer (MAD)': reste,
        'État de Règlement': statusText,
        'Résidence': profile.residences?.name || 'Résidence Al Andalous',
        'Date du Rapport': new Date().toLocaleDateString('fr-FR')
      }
    })

    exportToExcel(
      exportData,
      `Rapport_Societes_Factures_${(profile.residences?.name || 'Syndic').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      'Sociétés & Factures'
    )
  }

  async function inviteSociete(e) {
    e.preventDefault()
    setSending(true)
    setStatus(null)

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'societe_externe',
          residence_id: profile.residence_id,
          invited_by: profile.id
        })
      })
      const data = await res.json()
      if (data.error) {
        setStatus({ ok: false, message: data.error })
      } else {
        setStatus({ ok: true, message: t('societes.success') })
        setInviteEmail('')
      }
    } catch (err) {
      setStatus({ ok: false, message: t('residents.networkError') })
    }
    setSending(false)
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  const totalFacturesSocietes = docs.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const totalPayeSocietes = docs.filter(d => d.doc_status === 'paye').reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const totalResteSocietes = Math.max(0, totalFacturesSocietes - totalPayeSocietes)

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with direct Excel Report Button */}
      <div className="card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        padding: '14px 18px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>📊 Rapports & Factures des Sociétés</h3>
          <p className="muted small" style={{ margin: '2px 0 0 0' }}>Générez à tout moment l'état des règlements et factures prestataires</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#15803d',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.92rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={handleExportExcel}
        >
          📥 Générer Rapport Excel (Sociétés & Factures)
        </button>
      </div>

      {/* Financial metrics for companies */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        <div className="card" style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px' }}>Sociétés partenaires</span>
          <strong style={{ fontSize: '1.25rem', color: '#1e293b' }}>{societes.length}</strong>
        </div>
        <div className="card" style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px', color: '#166534' }}>Total Factures Réglées</span>
          <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>✅ {totalPayeSocietes} DH</strong>
        </div>
        <div className="card" style={{
          padding: '14px',
          background: totalResteSocietes > 0 ? '#fff7ed' : '#f0fdf4',
          border: `1px solid ${totalResteSocietes > 0 ? '#fed7aa' : '#bbf7d0'}`,
          borderRadius: '10px'
        }}>
          <span className="muted small" style={{
            display: 'block',
            marginBottom: '4px',
            color: totalResteSocietes > 0 ? '#9a3412' : '#166534'
          }}>
            {totalResteSocietes > 0 ? 'Reste à payer aux sociétés' : 'Factures à jour'}
          </span>
          <strong style={{
            fontSize: '1.25rem',
            color: totalResteSocietes > 0 ? '#c2410c' : '#15803d'
          }}>
            {totalResteSocietes > 0 ? `${totalResteSocietes} DH` : 'Toutes réglées 🎉'}
          </strong>
        </div>
      </div>

      {/* 1. Devis & Factures Panel - visible immédiatement */}
      <DevisFacturesPanel canManage={true} />

      {/* 2. Liste des sociétés partenaires */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0 }}>{t('societes.listTitle')} ({societes.length})</h3>
            <p className="muted small" style={{ margin: '2px 0 0 0' }}>Liste des prestataires externes et état de leurs règlements</p>
          </div>
          {societes.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#047857',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={handleExportExcel}
            >
              📊 Exporter Excel (.xlsx)
            </button>
          )}
        </div>

        {societes.length === 0 ? (
          <p className="muted small" style={{ marginTop: '8px' }}>Aucune société enregistrée pour le moment.</p>
        ) : (
          <table className="mini-table" style={{ marginTop: '12px' }}>
            <thead>
              <tr>
                <th>Société</th>
                <th>Téléphone</th>
                <th>Nb Factures / Devis</th>
                <th>Total Facturé</th>
                <th>Payé par Syndic</th>
                <th>Reste à régler</th>
                <th>État de Règlement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {societes.map(s => {
                const sDocs = docs.filter(d => d.resident_id === s.id || d.user_id === s.id)
                const totalFacture = sDocs.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
                const totalPaye = sDocs.filter(d => d.doc_status === 'paye').reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
                const reste = Math.max(0, totalFacture - totalPaye)
                const isPaidAll = totalFacture > 0 && reste === 0

                return (
                  <tr key={s.id}>
                    <td><strong>{s.full_name}</strong></td>
                    <td>{s.phone || '—'}</td>
                    <td>{sDocs.length}</td>
                    <td><strong>{totalFacture} DH</strong></td>
                    <td><span style={{ color: '#15803d', fontWeight: 700 }}>{totalPaye} DH</span></td>
                    <td><span style={{ color: reste > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>{reste} DH</span></td>
                    <td>
                      {totalFacture === 0 ? (
                        <span className="muted small">— Aucun document</span>
                      ) : isPaidAll ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1.5px solid #86efac',
                          fontWeight: 800,
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem'
                        }}>
                          🟢 Réglé
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1.5px solid #fca5a5',
                          fontWeight: 800,
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem'
                        }}>
                          🔴 Non réglé
                        </span>
                      )}
                    </td>
                    <td>
                      {totalFacture > 0 && (
                        <button
                          type="button"
                          className={isPaidAll ? 'btn-secondary small' : 'btn-primary small'}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => handleToggleRegle(s.id, isPaidAll)}
                        >
                          {isPaidAll ? 'Marquer non réglé' : '✅ Marquer réglé'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Inviter une nouvelle société */}
      <div className="card invite-card">
        <h3>{t('societes.inviteTitle')}</h3>
        <form onSubmit={inviteSociete} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            type="email"
            placeholder={t('residents.emailPlaceholder')}
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
          />
          <button className="btn-secondary small" type="submit" disabled={sending}>
            {sending ? t('residents.sending') : t('residents.send')}
          </button>
        </form>
        {status && (
          <p className={status.ok ? 'success small' : 'error small'} style={{ marginTop: '8px' }}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  )
}
