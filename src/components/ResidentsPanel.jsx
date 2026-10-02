import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { exportToExcel } from '../lib/exportExcel'
import PaymentReceiptModal from './PaymentReceiptModal'

export default function ResidentsPanel({ filterImmeubleId = null }) {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [residents, setResidents] = useState([])
  const [immeubles, setImmeubles] = useState([])
  const [charges, setCharges] = useState([])
  const [payments, setPayments] = useState([])
  const [selectedResident, setSelectedResident] = useState(null)
  const [receiptModal, setReceiptModal] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState('all') // 'all', 'paid', 'unpaid'
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteApt, setInviteApt] = useState('')
  const [inviteImmeuble, setInviteImmeuble] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const canInvite = profile.role === 'syndic'

  function sendWhatsAppReminder(resident, totalOwed, reste) {
    let phone = (resident.phone || '').replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
      phone = '212' + phone.substring(1)
    }
    let message = ''
    if (reste > 0) {
      message = `السلام عليكم ورحمة الله وبركاته ${resident.full_name}،
تذكير ودي من السنديك بخصوص مساهمة الشقة رقم ${resident.apartment_number || '—'}.
المبلغ المستحق: ${reste} درهم.
نشكركم جزيل الشكر على حسن تعاونكم ووفائكم لخدمة نظافة وصيانة الإقامة.
إدارة السنديك (${profile.residences?.name || 'الإقامة'}).`
    } else {
      message = `السلام عليكم ورحمة الله وبركاته ${resident.full_name}،
نتواصل معكم من إدارة السنديك (${profile.residences?.name || 'الإقامة'}).
حسابكم بخصوص واجبات السنديك خالص كلياً (0 درهم). نشكركم على التزامكم الدائم.
تحياتنا الخالصة.`
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  async function load() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, full_name, phone, apartment_number, role, immeuble_id, created_at')
      .eq('residence_id', profile.residence_id)
      .order('role')

    if (filterImmeubleId) {
      query = query.eq('immeuble_id', filterImmeubleId)
    }

    const { data } = await query
    setResidents(data || [])

    // Load charges
    const { data: chgData } = await supabase
      .from('charges')
      .select('*')
      .eq('residence_id', profile.residence_id)
    setCharges(chgData || [])

    // Load payments
    const { data: payData } = await supabase
      .from('payments')
      .select('*, charges(*)')
      .eq('residence_id', profile.residence_id)
    setPayments(payData || [])

    if (canInvite) {
      const { data: immData } = await supabase
        .from('immeubles')
        .select('id, name')
        .eq('residence_id', profile.residence_id)
      setImmeubles(immData || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) load()
  }, [profile, filterImmeubleId])

  function copyCode() {
    navigator.clipboard.writeText(profile.residences?.invite_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleTogglePaid(residentId, chargeId, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'
    const existing = payments.find(p => (p.paid_by === residentId || p.resident_id === residentId) && p.charge_id === chargeId)
    const chg = charges.find(c => c.id === chargeId)

    if (existing) {
      await supabase.from('payments').update({
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        note: newStatus === 'paid' ? 'Validé manuellement par le syndic' : null
      }).eq('id', existing.id)
    } else {
      await supabase.from('payments').insert({
        charge_id: chargeId,
        paid_by: residentId,
        resident_id: residentId,
        residence_id: profile.residence_id,
        amount: chg?.amount || 0,
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        note: 'Validé manuellement par le syndic'
      })
    }
    load()
  }

  async function inviteResident(e) {
    e.preventDefault()
    setSending(true)
    setInviteStatus(null)

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'resident',
          residence_id: profile.residence_id,
          immeuble_id: inviteImmeuble || null,
          apartment_number: inviteApt,
          invited_by: profile.id
        })
      })
      const data = await res.json()

      if (data.error) {
        setInviteStatus({ ok: false, message: data.error })
      } else {
        setInviteStatus({ ok: true, message: t('residents.success') })
        setInviteEmail('')
        setInviteApt('')
        setInviteImmeuble('')
        load()
      }
    } catch (err) {
      setInviteStatus({ ok: false, message: t('residents.networkError') })
    }
    setSending(false)
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  const residentProfiles = residents.filter(r => r.role === 'resident')
  const totalCotisationsCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const paidCount = residentProfiles.filter(r => {
    const rPay = payments.filter(p => (p.paid_by === r.id || p.resident_id === r.id) && p.status === 'paid')
    const paidSum = rPay.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const owedSum = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0)
    return paidSum >= owedSum && owedSum > 0
  }).length

  const unpaidCount = residentProfiles.length - paidCount

  const filteredResidents = residents.filter(r => {
    if (paymentFilter === 'all') return true
    if (r.role !== 'resident') return false
    const rPayments = payments.filter(p => p.paid_by === r.id || p.resident_id === r.id)
    const totalOwed = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    const totalPaid = rPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const isUpToDate = totalPaid >= totalOwed && totalOwed > 0
    if (paymentFilter === 'paid') return isUpToDate
    if (paymentFilter === 'unpaid') return !isUpToDate
    return true
  })

  function handleExportExcel() {
    const exportData = residents.filter(r => r.role === 'resident').map(r => {
      const rPayments = payments.filter(p => p.paid_by === r.id || p.resident_id === r.id)
      const totalOwed = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
      const totalPaid = rPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      const reste = Math.max(0, totalOwed - totalPaid)
      const isUpToDate = totalPaid >= totalOwed && totalOwed > 0

      return {
        'Nom du résident': r.full_name,
        'Appartement': r.apartment_number || '—',
        'Téléphone': r.phone || '—',
        'Total Cotisations (MAD)': totalOwed,
        'Montant Réglé (MAD)': totalPaid,
        'Reste à Payer (MAD)': reste,
        'État Cotisations': isUpToDate ? 'Payé' : 'Non payé',
        'Résidence': profile.residences?.name || 'Résidence Al Andalous',
        'Date du Rapport': new Date().toLocaleDateString('fr-FR')
      }
    })

    exportToExcel(
      exportData,
      `Rapport_Cotisations_Residents_${(profile.residences?.name || 'Syndic').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      'Cotisations Résidents'
    )
  }

  return (
    <div className="panel">
      {/* Top Banner with direct Excel Report Button */}
      <div className="card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        marginBottom: '16px',
        padding: '14px 18px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>📊 Rapports & Suivi des Cotisations</h3>
          <p className="muted small" style={{ margin: '2px 0 0 0' }}>Générez à tout moment la situation financière détaillée des résidents</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canInvite && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
              onClick={() => setShowInviteModal(!showInviteModal)}
            >
              {showInviteModal ? '✕ Fermer' : '➕ Inviter un résident'}
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#15803d',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onClick={handleExportExcel}
          >
            📥 Générer Rapport Excel (Résidents)
          </button>
        </div>
      </div>

      {/* Financial recap for syndic */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div className="card" style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px' }}>Résidents actifs</span>
          <strong style={{ fontSize: '1.25rem', color: '#1e293b' }}>{residentProfiles.length}</strong>
        </div>
        <div className="card" style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px', color: '#166534' }}>Total Cotisations Encaissées</span>
          <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>✅ {totalCotisationsCollected} DH</strong>
        </div>
        <div className="card" style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px', color: '#166534' }}>Résidents à jour</span>
          <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>
            {paidCount} / {residentProfiles.length}
          </strong>
        </div>
      </div>

      {canInvite && showInviteModal && (
        <div className="card invite-card" style={{ border: '2px solid #0284c7', background: '#f0f9ff' }}>
          <h3>{t('residents.inviteTitle')}</h3>
          <p className="muted small">{t('residents.inviteSubtitle')}</p>
          <form onSubmit={inviteResident} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <input
              type="email"
              placeholder={t('residents.emailPlaceholder')}
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
            />
            {immeubles.length > 0 && (
              <select value={inviteImmeuble} onChange={e => setInviteImmeuble(e.target.value)}>
                <option value="">{t('residents.noImmeuble')}</option>
                {immeubles.map(im => (
                  <option key={im.id} value={im.id}>{im.name}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              placeholder={t('residents.apartmentPlaceholder')}
              value={inviteApt}
              onChange={e => setInviteApt(e.target.value)}
            />
            <button className="btn-secondary small" type="submit" disabled={sending}>
              {sending ? t('residents.sending') : t('residents.send')}
            </button>
          </form>
          {inviteStatus && (
            <p className={inviteStatus.ok ? 'success small' : 'error small'} style={{ marginTop: '8px' }}>
              {inviteStatus.message}
            </p>
          )}

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #bae6fd' }}>
            <strong style={{ fontSize: '0.9rem', color: '#0369a1' }}>{t('residents.codeTitle')} :</strong>
            <span className="muted small" style={{ display: 'block', margin: '2px 0 6px 0' }}>{t('residents.codeSubtitle')}</span>
            <div className="invite-code-box">
              <code>{profile.residences?.invite_code}</code>
              <button className="btn-secondary small" onClick={copyCode}>{copied ? t('residents.copied') : t('residents.copy')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0 }}>{t('residents.membersTitle')} ({residents.length})</h3>
            <p className="muted small" style={{ margin: '2px 0 0 0' }}>Suivi des cotisations et des résidents en temps réel</p>
          </div>
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
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <button
            type="button"
            className={'tab' + (paymentFilter === 'all' ? ' active' : '')}
            style={{ padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem' }}
            onClick={() => setPaymentFilter('all')}
          >
            👥 Tous ({residents.length})
          </button>
          <button
            type="button"
            className={'tab' + (paymentFilter === 'paid' ? ' active' : '')}
            style={{ padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', background: paymentFilter === 'paid' ? '#ecfdf5' : '#f8fafc', color: paymentFilter === 'paid' ? '#047857' : '#475569', borderColor: '#a7f3d0' }}
            onClick={() => setPaymentFilter('paid')}
          >
            🟢 À jour / Payé ({paidCount})
          </button>
          <button
            type="button"
            className={'tab' + (paymentFilter === 'unpaid' ? ' active' : '')}
            style={{ padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', background: paymentFilter === 'unpaid' ? '#fef2f2' : '#f8fafc', color: paymentFilter === 'unpaid' ? '#b91c1c' : '#475569', borderColor: '#fecaca' }}
            onClick={() => setPaymentFilter('unpaid')}
          >
            🔴 Impayés / En retard ({unpaidCount})
          </button>
        </div>

        <table className="mini-table">
          <thead>
            <tr>
              <th>{t('residents.tableName')}</th>
              <th>{t('residents.tableRole')}</th>
              <th>{t('residents.tableApartment')}</th>
              <th>{t('residents.tablePhone')}</th>
              <th>Total Dû</th>
              <th>Montant Payé</th>
              <th>Reste à Payer</th>
              <th>État Cotisations</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResidents.map(r => {
              const rPayments = payments.filter(p => p.paid_by === r.id || p.resident_id === r.id)
              const totalOwed = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
              const totalPaid = rPayments
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
              const reste = Math.max(0, totalOwed - totalPaid)

              const isUpToDate = totalPaid >= totalOwed && totalOwed > 0
              const hasPartial = totalPaid > 0 && totalPaid < totalOwed
              const isUnpaid = totalPaid === 0 && totalOwed > 0

              return (
                <tr key={r.id}>
                  <td><strong>{r.full_name}</strong></td>
                  <td>{t('roles.' + r.role)}</td>
                  <td>{r.apartment_number || '—'}</td>
                  <td>{r.phone || '—'}</td>
                  <td>{r.role === 'resident' ? <strong>{totalOwed} DH</strong> : '—'}</td>
                  <td>{r.role === 'resident' ? <span style={{ color: '#15803d', fontWeight: 700 }}>{totalPaid} DH</span> : '—'}</td>
                  <td>{r.role === 'resident' ? <span style={{ color: reste > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>{reste} DH</span> : '—'}</td>
                  <td>
                    {r.role === 'resident' ? (
                      isUpToDate ? (
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
                          🟢 Payé
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
                          🔴 Non payé
                        </span>
                      )
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                  <td>
                    {r.role === 'resident' && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-secondary small"
                          style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                          onClick={() => setSelectedResident(selectedResident?.id === r.id ? null : r)}
                        >
                          {selectedResident?.id === r.id ? 'Fermer' : '📋 Détails'}
                        </button>

                        {!isUpToDate ? (
                          <button
                            type="button"
                            className="btn-secondary small"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => sendWhatsAppReminder(r, totalOwed, reste)}
                            title="Envoyer un rappel de cotisation par WhatsApp"
                          >
                            💬 Rappel WhatsApp
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary small"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => sendWhatsAppReminder(r, totalOwed, 0)}
                            title="Contacter le résident par WhatsApp"
                          >
                            💬 WhatsApp
                          </button>
                        )}

                        {totalPaid > 0 && (
                          <button
                            type="button"
                            className="btn-secondary small"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.76rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const lastPaid = rPayments.find(p => p.status === 'paid') || {
                                id: `pay-${r.id}`,
                                amount: totalPaid,
                                note: 'Cotisations de copropriété',
                                paid_at: new Date().toISOString()
                              }
                              setReceiptModal({ payment: lastPaid, resident: r, charge: charges[0] })
                            }}
                            title="Télécharger ou imprimer le reçu officiel de cotisation"
                          >
                            🧾 Reçu PDF
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded resident payment detail modal/panel */}
      {selectedResident && (
        <div className="card" style={{ marginTop: '16px', border: '2px solid #0284c7', background: '#f0f9ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#0369a1' }}>
              Détails des charges de {selectedResident.full_name} ({selectedResident.apartment_number ? `Apt ${selectedResident.apartment_number}` : ''})
            </h3>
            <button className="btn-secondary small" onClick={() => setSelectedResident(null)}>✕ Fermer</button>
          </div>

          <table className="mini-table" style={{ background: '#fff' }}>
            <thead>
              <tr>
                <th>Charge / Motif</th>
                <th>Montant</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Justificatif / Note</th>
                <th>Actions syndic</th>
              </tr>
            </thead>
            <tbody>
              {charges.map(c => {
                const pay = payments.find(p => (p.paid_by === selectedResident.id || p.resident_id === selectedResident.id) && p.charge_id === c.id)
                const isPaid = pay?.status === 'paid'

                return (
                  <tr key={c.id}>
                    <td><strong>{c.title}</strong></td>
                    <td><strong>{c.amount} DH</strong></td>
                    <td>{new Date(c.due_date).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: isPaid ? '#ecfdf5' : '#fef2f2',
                        color: isPaid ? '#047857' : '#b91c1c'
                      }}>
                        {isPaid ? '✅ Payé' : '🔴 Non payé'}
                      </span>
                    </td>
                    <td className="small muted">
                      {isPaid ? (pay?.note || `Payé le ${new Date(pay?.paid_at || Date.now()).toLocaleDateString('fr-FR')}`) : 'En attente'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className={isPaid ? 'btn-secondary small' : 'btn-primary small'}
                          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                          onClick={() => handleTogglePaid(selectedResident.id, c.id, pay?.status || 'pending')}
                        >
                          {isPaid ? 'Marquer impayé' : '✅ Marquer comme payé'}
                        </button>
                        {!isPaid && (
                          <button
                            type="button"
                            className="btn-secondary small"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => sendWhatsAppReminder(selectedResident, c.amount, c.amount)}
                            title="Envoyer un rappel de cette charge par WhatsApp"
                          >
                            💬 Rappel WhatsApp
                          </button>
                        )}
                        {isPaid && (
                          <button
                            type="button"
                            className="btn-secondary small"
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                            onClick={() => setReceiptModal({ payment: pay, resident: selectedResident, charge: c })}
                          >
                            🧾 Reçu PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Receipt Modal */}
      {receiptModal && (
        <PaymentReceiptModal
          payment={receiptModal.payment}
          resident={receiptModal.resident}
          charge={receiptModal.charge}
          residence={profile.residences}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  )
}
