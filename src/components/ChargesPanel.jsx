import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ChargesPanel({ canManage }) {
  const { profile, user } = useAuth()
  const { t } = useLanguage()
  const [charges, setCharges] = useState([])
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', amount: '', due_date: '', description: '' })
  const [creating, setCreating] = useState(false)

  const STATUS_LABEL = {
    pending: t('charges.status.pending'),
    paid: t('charges.status.paid'),
    late: t('charges.status.late')
  }

  async function loadData() {
    setLoading(true)
    const { data: chargesData } = await supabase
      .from('charges')
      .select('*, payments(id, resident_id, status, amount, paid_at, profiles:resident_id(full_name, apartment_number))')
      .eq('residence_id', profile.residence_id)
      .order('due_date', { ascending: false })
    setCharges(chargesData || [])

    if (canManage) {
      const { data: residentsData } = await supabase
        .from('profiles')
        .select('id, full_name, apartment_number')
        .eq('residence_id', profile.residence_id)
        .eq('role', 'resident')
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
          resident_id: r.id,
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

  async function markPaid(paymentId) {
    await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', paymentId)
    loadData()
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  return (
    <div className="panel">
      {canManage && (
        <div className="card">
          <h3>{t('charges.createTitle')}</h3>
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

      {charges.map(charge => {
        const myPayment = charge.payments?.find(p => p.resident_id === user.id)
        return (
          <div key={charge.id} className="card charge-card">
            <div className="charge-head">
              <div>
                <h4>{charge.title}</h4>
                <span className="muted small">{t('charges.dueDate')} {new Date(charge.due_date).toLocaleDateString('fr-FR')} · {charge.amount} DH</span>
              </div>
              {!canManage && myPayment && (
                <span className={'status-pill ' + myPayment.status}>{STATUS_LABEL[myPayment.status]}</span>
              )}
            </div>
            {charge.description && <p className="muted small">{charge.description}</p>}

            {!canManage && myPayment && myPayment.status !== 'paid' && (
              <button className="btn-primary small" onClick={() => markPaid(myPayment.id)}>{t('charges.markPaid')}</button>
            )}

            {canManage && (
              <table className="mini-table">
                <thead>
                  <tr><th>{t('charges.tableResident')}</th><th>{t('charges.tableApartment')}</th><th>{t('charges.tableStatus')}</th></tr>
                </thead>
                <tbody>
                  {charge.payments?.map(p => (
                    <tr key={p.id}>
                      <td>{p.profiles?.full_name}</td>
                      <td>{p.profiles?.apartment_number || '—'}</td>
                      <td><span className={'status-pill ' + p.status}>{STATUS_LABEL[p.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
