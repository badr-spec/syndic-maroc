import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const MAX_MB = 5
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

export default function VirementForm({
  kind = 'virement',
  title = 'Déclarer un virement',
  submitLabel = 'Envoyer la preuve',
  successText = 'Virement enregistré avec succès ! Votre charge est maintenant marquée comme PAYÉE ✅',
  notePlaceholder = 'Note (ex: charges octobre)',
  onDone
}) {
  const { user, profile } = useAuth()
  const [charges, setCharges] = useState([])
  const [selectedChargeId, setSelectedChargeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [fileKey, setFileKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const isVirement = kind === 'virement'
  const fileLabel = isVirement ? 'la preuve de virement' : kind === 'devis' ? 'le devis' : 'la facture'

  useEffect(() => {
    if (profile?.residence_id && isVirement) {
      supabase.from('charges').select('*').eq('residence_id', profile.residence_id).then(({ data }) => {
        if (data && data.length > 0) {
          setCharges(data)
          // Default to the first pending charge or 250 DH charge if available
          const def = data.find(c => c.amount === 250) || data[0]
          if (def) {
            setSelectedChargeId(def.id)
            setAmount(String(def.amount))
            setNote(def.title)
          }
        }
      })
    }
  }, [profile, isVirement])

  function handleSelectCharge(e) {
    const cid = e.target.value
    setSelectedChargeId(cid)
    const chg = charges.find(c => c.id === cid)
    if (chg) {
      setAmount(String(chg.amount))
      if (!note || charges.some(c => c.title === note)) {
        setNote(chg.title)
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg(null)
    if (!file) return setMsg({ ok: false, text: `Ajoutez ${fileLabel}` })
    if (!ALLOWED.includes(file.type)) return setMsg({ ok: false, text: 'Format accepté : PNG, JPG, WEBP ou PDF' })
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `Fichier trop lourd (max ${MAX_MB} Mo)` })

    setSaving(true)
    const currentUid = user?.id || profile?.id || 'usr-current'
    const ext = file.name.split('.').pop()
    const path = `${profile.residence_id}/${currentUid}/${kind}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from('preuves').upload(path, file)
    if (upErr) { setSaving(false); return setMsg({ ok: false, text: upErr.message }) }

    const { data: row, error: insErr } = await supabase.from('virements').insert({
      residence_id: profile.residence_id,
      resident_id: currentUid,
      amount: Number(amount),
      reference,
      note,
      proof_path: path,
      kind,
    }).select().single()

    if (insErr) { setSaving(false); return setMsg({ ok: false, text: insErr.message }) }

    // Synchronize payment status immediately in charges & payments
    try {
      const chargeTarget = selectedChargeId || charges.find(c => Number(c.amount) === Number(amount))?.id || 'chg-2'
      if (chargeTarget) {
        // Update payments in database
        const { data: existList } = await supabase.from('payments').select('*').eq('charge_id', chargeTarget).eq('paid_by', user.id)
        if (existList && existList.length > 0) {
          await supabase.from('payments').update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            amount: Number(amount),
            proof_url: path,
            note: reference ? `Virement réf: ${reference}` : (note || 'Virement bancaire validé'),
            receipt_sent: true
          }).eq('id', existList[0].id)
        } else {
          await supabase.from('payments').insert({
            charge_id: chargeTarget,
            paid_by: user.id,
            resident_id: user.id,
            residence_id: profile.residence_id,
            amount: Number(amount),
            status: 'paid',
            paid_at: new Date().toISOString(),
            proof_url: path,
            note: reference ? `Virement réf: ${reference}` : (note || 'Virement bancaire validé'),
            receipt_sent: true
          })
        }

        // Also ensure localStorage payments are updated
        const localPay = JSON.parse(localStorage.getItem('syndic_maroc_payments') || '[]')
        const idx = localPay.findIndex(p => p.charge_id === chargeTarget || (p.amount === Number(amount) && p.resident_id === user.id))
        if (idx >= 0) {
          localPay[idx].status = 'paid'
          localPay[idx].paid_at = new Date().toISOString()
          localPay[idx].receipt_sent = true
          localStorage.setItem('syndic_maroc_payments', JSON.stringify(localPay))
        }
      }
    } catch (e) {
      console.error(e)
    }

    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/notify-virement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ virementId: row?.id || 'vir_local' }),
    }).catch(() => {})

    setSaving(false)
    setMsg({ ok: true, text: successText })
    setReference('')
    setFile(null)
    setFileKey(k => k + 1)
    onDone?.()
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: 12 }}>
      <h3>{title}</h3>

      {isVirement && charges.length > 0 && (
        <div>
          <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>
            Sélectionnez la charge concernée :
          </label>
          <select
            value={selectedChargeId}
            onChange={handleSelectCharge}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            {charges.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} — {c.amount} DH (Échéance: {new Date(c.due_date).toLocaleDateString('fr-FR')})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>Montant du virement (MAD)</label>
        <input type="number" min="1" step="0.01" placeholder="Montant (MAD)"
               value={amount} onChange={e => setAmount(e.target.value)} required />
      </div>

      <div>
        <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>Référence bancaire (ex: VIR-2026-B14)</label>
        <input placeholder={isVirement ? 'Référence du virement (optionnel)' : 'N° du document (optionnel)'}
               value={reference} onChange={e => setReference(e.target.value)} />
      </div>

      <div>
        <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>Note / Justificatif</label>
        <input placeholder={notePlaceholder}
               value={note} onChange={e => setNote(e.target.value)} required={!isVirement} />
      </div>

      <div>
        <label className="small muted" style={{ display: 'block', marginBottom: '4px' }}>Preuve de paiement (Image ou PDF)</label>
        <input key={fileKey} type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
               onChange={e => setFile(e.target.files[0] || null)} required />
      </div>

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Envoi en cours...' : submitLabel}
      </button>
      {msg && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: msg.ok ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${msg.ok ? '#a7f3d0' : '#fecaca'}`
        }}>
          <p className={msg.ok ? 'small' : 'error small'} style={{ margin: 0, fontWeight: 600, color: msg.ok ? '#047857' : '#b91c1c' }}>
            {msg.text}
          </p>
        </div>
      )}
    </form>
  )
}
