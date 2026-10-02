import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import PaymentReceiptModal from './PaymentReceiptModal'
import GenerateMonthlyChargesModal from './GenerateMonthlyChargesModal'
import GroupWhatsAppRelanceModal from './GroupWhatsAppRelanceModal'

export default function ChargesPanel({ canManage }) {
  const { profile, user } = useAuth()
  const { t, lang } = useLanguage()
  const [charges, setCharges] = useState([])
  const [residents, setResidents] = useState([])
  const [residence, setResidence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [receiptModal, setReceiptModal] = useState(null)
  const [showMonthlyGenerator, setShowMonthlyGenerator] = useState(false)
  const [groupRelanceModal, setGroupRelanceModal] = useState(null)
  const [form, setForm] = useState({ title: '', amount: '', due_date: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [uploadingFor, setUploadingFor] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  const STATUS_LABEL = {
    pending: t('charges.status.pending'),
    paid: t('charges.status.paid'),
    late: t('charges.status.late'),
    pending_verification: t('charges.status.pendingVerification'),
    rejected: t('charges.status.rejected')
  }

  async function loadData() {
    setLoading(true)
    const { data: chargesData } = await supabase
      .from('charges')
      .select('*, payments(id, paid_by, status, amount, paid_at, proof_url, transaction_id, profiles:paid_by(full_name, apartment_number))')
      .eq('residence_id', profile.residence_id)
      .order('due_date', { ascending: false })
    setCharges(chargesData || [])

    const { data: residenceData } = await supabase
      .from('residences')
      .select('rib, beneficiaire')
      .eq('id', profile.residence_id)
      .single()
    setResidence(residenceData || null)

    if (canManage) {
      const { data: residentsData } = await supabase
        .from('profiles')
        .select('id, full_name, apartment_number')
        .eq('residence_id', profile.residence_id)
        .in('role', ['resident', 'societe_externe'])
      setResidents(residentsData || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleCreateCharge(e) {
    e.preventDefault()
    setCreating(true)
    try {
      const { data: charge, error } = await supabase
        .from('charges')
        .insert({
          residence_id: profile.residence_id,
          title: form.title,
          description: form.description,
          amount: parseFloat(form.amount),
          due_date: form.due_date,
          created_by: user.id
        })
        .select()
        .single()
      if (error) throw error

      if (residents.length > 0) {
        const rows = residents.map(r => ({
          charge_id: charge.id,
          paid_by: r.id,
          residence_id: profile.residence_id,
          amount: parseFloat(form.amount),
          status: 'pending'
        }))
        await supabase.from('payments').insert(rows)
      }

      setForm({ title: '', amount: '', due_date: '', description: '' })
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleUploadProof(paymentId, file) {
    setUploadingFor(paymentId)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${paymentId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: 'pending_verification', proof_url: path, payment_method: 'virement' })
        .eq('id', paymentId)
      if (updateError) throw updateError

      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setUploadingFor(null)
    }
  }

  async function handleConfirm(paymentId, action) {
    setConfirmingId(paymentId)
    try {
      const res = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, action, syndic_id: profile.id })
      })
      const data = await res.json()
      if (data.error) alert(data.error)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setConfirmingId(null)
    }
  }

  async function viewProof(path) {
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    if (error) alert(error.message)
  }

  async function handleSyndicMarkPaid(residentId, chargeId, paymentId, isCurrentlyPaid) {
    const newStatus = isCurrentlyPaid ? 'pending' : 'paid'
    if (paymentId) {
      await supabase.from('payments').update({
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        note: newStatus === 'paid' ? 'Validé par le syndic (Espèces / Virement)' : null
      }).eq('id', paymentId)
    } else {
      const chg = charges.find(c => c.id === chargeId)
      await supabase.from('payments').insert({
        charge_id: chargeId,
        paid_by: residentId,
        resident_id: residentId,
        residence_id: profile.residence_id,
        amount: chg?.amount || 0,
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        note: 'Validé par le syndic (Espèces / Virement)'
      })
    }
    loadData()
  }

  function sendChargeWhatsApp(resident, charge) {
    let phone = (resident.phone || '').replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
      phone = '212' + phone.substring(1)
    }
    const message = `السلام عليكم ورحمة الله وبركاته ${resident.full_name}،
تذكير ودي من السنديك بخصوص واجب: "${charge.title}" لشقتكم رقم ${resident.apartment_number || '—'}.
المبلغ المطلوب: ${charge.amount} درهم.
تاريخ الاستحقاق: ${new Date(charge.due_date).toLocaleDateString('fr-FR')}.
نشكركم على حسن تعاونكم ووفائكم لخدمة نظافة وصيانة العمارة.`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  return (
    <div className="panel">
      {canManage && (
        <div className="card" style={{ border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>{t('charges.createTitle')}</h3>
            <button
              type="button"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#047857',
                borderColor: '#047857',
                fontSize: '0.84rem',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              onClick={() => setShowMonthlyGenerator(true)}
            >
              {lang === 'ar' ? '📅 توليد كوتيزات الشهر (نقرة واحدة)' : '📅 Générer l\'appel de fonds mensuel (1 clic)'}
            </button>
          </div>
          <form onSubmit={handleCreateCharge} className="inline-form">
            <input required placeholder={t('charges.titlePlaceholder')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input required type="number" step="0.01" placeholder={t('charges.amountPlaceholder')} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <input required type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            <input placeholder={t('charges.descriptionPlaceholder')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button className="btn-primary" disabled={creating}>{creating ? t('charges.creating') : t('charges.create')}</button>
          </form>
        </div>
      )}

      {charges.length === 0 && <p className="muted">{t('charges.none')}</p>}

      {!canManage && charges.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div className="card" style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <span className="muted small" style={{ display: 'block', marginBottom: '4px' }}>Total des charges</span>
            <strong style={{ fontSize: '1.25rem', color: '#1e293b' }}>
              {charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)} DH
            </strong>
          </div>
          <div className="card" style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
            <span className="muted small" style={{ display: 'block', marginBottom: '4px', color: '#166534' }}>Déjà payé (Réglé)</span>
            <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>
              ✅ {charges.reduce((sum, c) => {
                const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
                return sum + (p?.status === 'paid' ? (Number(c.amount) || 0) : 0)
              }, 0)} DH
            </strong>
          </div>
          <div className="card" style={{
            padding: '14px',
            background: charges.some(c => {
              const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
              return p?.status !== 'paid'
            }) ? '#fff7ed' : '#f0fdf4',
            border: `1px solid ${charges.some(c => {
              const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
              return p?.status !== 'paid'
            }) ? '#fed7aa' : '#bbf7d0'}`,
            borderRadius: '10px'
          }}>
            <span className="muted small" style={{
              display: 'block',
              marginBottom: '4px',
              color: charges.some(c => {
                const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
                return p?.status !== 'paid'
              }) ? '#9a3412' : '#166534'
            }}>
              {charges.some(c => {
                const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
                return p?.status !== 'paid'
              }) ? 'Reste à régler' : 'Situation à jour'}
            </span>
            <strong style={{
              fontSize: '1.25rem',
              color: charges.some(c => {
                const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
                return p?.status !== 'paid'
              }) ? '#c2410c' : '#15803d'
            }}>
              {charges.reduce((sum, c) => {
                const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
                return sum + (p?.status !== 'paid' ? (Number(c.amount) || 0) : 0)
              }, 0)} DH {charges.every(c => {
                const p = c.payments?.find(pm => (pm.paid_by === user?.id || pm.resident_id === user?.id || pm.paid_by === profile?.id || pm.resident_id === profile?.id))
                return p?.status === 'paid'
              }) ? '🎉' : ''}
            </strong>
          </div>
        </div>
      )}

      {charges.map(charge => {
        const myPayment = charge.payments?.find(p => (
          p.paid_by === user?.id ||
          p.resident_id === user?.id ||
          p.paid_by === profile?.id ||
          p.resident_id === profile?.id
        ))
        const isPaid = myPayment?.status === 'paid'
        const isPendingVerif = myPayment?.status === 'pending_verification'

        return (
          <div key={charge.id} className="card charge-card" style={{ borderLeft: isPaid ? '4px solid #10b981' : isPendingVerif ? '4px solid #f59e0b' : '4px solid #ef4444' }}>
            <div className="charge-head">
              <div>
                <h4>{charge.title}</h4>
                <span className="muted small">{t('charges.dueDate')} {new Date(charge.due_date).toLocaleDateString('fr-FR')} · <strong style={{ color: '#0f172a' }}>{charge.amount} DH</strong></span>
              </div>
              {!canManage && (
                <span className={'status-pill ' + (myPayment?.status || 'pending')} style={{
                  background: isPaid ? '#ecfdf5' : isPendingVerif ? '#fef3c7' : '#fef2f2',
                  color: isPaid ? '#047857' : isPendingVerif ? '#b45309' : '#b91c1c',
                  border: `1px solid ${isPaid ? '#a7f3d0' : isPendingVerif ? '#fde68a' : '#fecaca'}`,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem'
                }}>
                  {isPaid ? '✅ Payé' : isPendingVerif ? '⏳ Virement en cours de validation' : '🔴 Non payé'}
                </span>
              )}
            </div>
            {charge.description && <p className="muted small" style={{ marginTop: '6px' }}>{charge.description}</p>}

            {!canManage && isPaid && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.84rem', color: '#166534', fontWeight: 600 }}>
                  🎉 Cotisation de {charge.amount} DH réglée par virement {myPayment?.paid_at ? `le ${new Date(myPayment.paid_at).toLocaleDateString('fr-FR')}` : ''} {myPayment?.note ? `(${myPayment.note})` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary small"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setReceiptModal({
                      payment: myPayment,
                      resident: profile,
                      charge: charge
                    })}
                  >
                    🧾 Télécharger Reçu PDF
                  </button>
                  <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '3px 8px', borderRadius: '4px' }}>
                    Reçu #{myPayment?.id || 'OK'} ✓
                  </span>
                </div>
              </div>
            )}

            {!canManage && !isPaid && !isPendingVerif && (
              <div style={{ marginTop: '8px' }}>
                {residence?.rib && (
                  <div className="bank-transfer-info" style={{ background: '#f5f5f0', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                    <p className="muted small" style={{ marginBottom: '8px' }}>
                      {t('charges.bankTransferInstructions') || 'Payez par virement avec les coordonnées ci-dessous, puis envoyez la preuve.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="small">{t('charges.beneficiary') || 'Bénéficiaire'}: <strong>{residence.beneficiaire}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="small" style={{ fontFamily: 'monospace' }}>{residence.rib}</span>
                      <button
                        type="button"
                        className="btn-secondary small"
                        onClick={() => copyToClipboard(residence.rib, 'rib-' + charge.id)}
                      >
                        {copiedField === 'rib-' + charge.id ? '✓' : (t('charges.copy') || 'Copier')}
                      </button>
                    </div>
                    {myPayment?.transaction_id && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="small">
                          {t('charges.reference') || 'Référence'}: <span style={{ fontFamily: 'monospace' }}>{myPayment.transaction_id}</span>
                        </span>
                        <button
                          type="button"
                          className="btn-secondary small"
                          onClick={() => copyToClipboard(myPayment.transaction_id, 'ref-' + charge.id)}
                        >
                          {copiedField === 'ref-' + charge.id ? '✓' : (t('charges.copy') || 'Copier')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {myPayment?.id && (
                  <label className="btn-primary small" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    {uploadingFor === myPayment.id ? t('charges.uploading') : t('charges.uploadProof')}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => e.target.files[0] && handleUploadProof(myPayment.id, e.target.files[0])}
                      disabled={uploadingFor === myPayment.id}
                    />
                  </label>
                )}
              </div>
            )}

            {!canManage && myPayment && myPayment.status === 'pending_verification' && (
              <p className="muted small">{t('charges.verificationPending')}</p>
            )}

            {canManage && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <h5 style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                    {lang === 'ar'
                      ? `متابعة أداء هذه المساهمة (${residents.filter(r => r.role === 'resident').length} شقة) :`
                      : `Suivi des paiements pour cette charge (${residents.filter(r => r.role === 'resident').length} résidents) :`}
                  </h5>
                  <button
                    type="button"
                    className="btn-secondary small"
                    onClick={() => setGroupRelanceModal({
                      charge,
                      unpaidResidents: residents.filter(r => {
                        if (r.role !== 'resident') return false
                        const p = charge.payments?.find(pm => pm.paid_by === r.id || pm.resident_id === r.id)
                        return p?.status !== 'paid'
                      })
                    })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#f0fdf4',
                      color: '#15803d',
                      borderColor: '#86efac',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'ar' ? '📢 تذكير واتساب جماعي' : '📢 Relance WhatsApp groupée'}
                  </button>
                </div>
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Résident</th>
                      <th>Appartement</th>
                      <th>Statut Paiement</th>
                      <th>Détail / Reçu</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residents.filter(r => r.role === 'resident').map(r => {
                      const p = charge.payments?.find(pm => pm.paid_by === r.id || pm.resident_id === r.id)
                      const isPaid = p?.status === 'paid'
                      const isPendingVerif = p?.status === 'pending_verification'

                      return (
                        <tr key={r.id}>
                          <td><strong>{r.full_name}</strong></td>
                          <td>{r.apartment_number || '—'}</td>
                          <td>
                            <span className={'status-pill ' + (p?.status || 'pending')} style={{
                              background: isPaid ? '#ecfdf5' : isPendingVerif ? '#fef3c7' : '#fef2f2',
                              color: isPaid ? '#047857' : isPendingVerif ? '#b45309' : '#b91c1c',
                              border: `1px solid ${isPaid ? '#a7f3d0' : isPendingVerif ? '#fde68a' : '#fecaca'}`,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.78rem'
                            }}>
                              {isPaid ? '✅ Payé' : isPendingVerif ? '⏳ Virement en attente' : '🔴 Non payé'}
                            </span>
                          </td>
                          <td className="small muted">
                            {isPaid ? (p?.note || `Payé le ${new Date(p?.paid_at || Date.now()).toLocaleDateString('fr-FR')}`) : 'En attente de règlement'}
                          </td>
                          <td>
                            {p?.proof_url && (
                              <button className="btn-secondary small" onClick={() => viewProof(p.proof_url)} style={{ marginRight: '6px' }}>
                                {t('charges.viewProof')}
                              </button>
                            )}
                            {isPendingVerif && (
                              <>
                                <button
                                  className="btn-primary small"
                                  onClick={() => handleConfirm(p.id, 'confirm')}
                                  disabled={confirmingId === p.id}
                                  style={{ marginRight: '6px' }}
                                >
                                  {t('charges.confirm')}
                                </button>
                                <button
                                  className="btn-secondary small"
                                  onClick={() => handleConfirm(p.id, 'reject')}
                                  disabled={confirmingId === p.id}
                                  style={{ marginRight: '6px' }}
                                >
                                  {t('charges.reject')}
                                </button>
                              </>
                            )}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className={isPaid ? 'btn-secondary small' : 'btn-primary small'}
                                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                onClick={() => handleSyndicMarkPaid(r.id, charge.id, p?.id, isPaid)}
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
                                  onClick={() => sendChargeWhatsApp(r, charge)}
                                  title="Envoyer un rappel de paiement par WhatsApp"
                                >
                                  💬 Rappel WhatsApp
                                </button>
                              )}

                              {isPaid && (
                                <button
                                  type="button"
                                  className="btn-secondary small"
                                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                  onClick={() => setReceiptModal({
                                    payment: p || { id: `pay-${r.id}`, amount: charge.amount, paid_at: new Date().toISOString() },
                                    resident: r,
                                    charge: charge
                                  })}
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
          </div>
        )
      })}

      {receiptModal && (
        <PaymentReceiptModal
          payment={receiptModal.payment}
          resident={receiptModal.resident}
          charge={receiptModal.charge}
          residence={profile.residences}
          onClose={() => setReceiptModal(null)}
        />
      )}

      {showMonthlyGenerator && (
        <GenerateMonthlyChargesModal
          residenceId={profile.residence_id}
          residents={residents}
          onGenerated={loadData}
          onClose={() => setShowMonthlyGenerator(false)}
        />
      )}

      {groupRelanceModal && (
        <GroupWhatsAppRelanceModal
          charge={groupRelanceModal.charge}
          unpaidResidents={groupRelanceModal.unpaidResidents}
          residence={profile.residences}
          onClose={() => setGroupRelanceModal(null)}
        />
      )}
    </div>
  )
}
