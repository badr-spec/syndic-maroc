import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const MAX_MB = 5
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

const STATUS_LABEL = {
  en_attente: 'En attente',
  accepte: 'Accepté',
  approuve: '🔴 Non réglé',
  refuse: 'Refusé',
  paye: '🟢 Réglé'
}

const STATUS_COLOR = {
  en_attente: { background: '#fdf3d8', color: '#7a5a00', border: '1px solid #fde68a' },
  accepte: { background: '#e2f2e7', color: '#1d5b34', border: '1px solid #a7f3d0' },
  approuve: { background: '#fee2e2', color: '#b91c1c', border: '1.5px solid #fca5a5' },
  refuse: { background: '#fbe3e1', color: '#8a2a20', border: '1px solid #fecaca' },
  paye: { background: '#dcfce7', color: '#15803d', border: '1.5px solid #86efac' }
}

function StatusPill({ status }) {
  const s = status || 'en_attente'
  return (
    <span className="small" style={{ ...STATUS_COLOR[s], padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: '0.82rem' }}>
      {STATUS_LABEL[s] || s}
    </span>
  )
}

async function openFile(path) {
  const { data, error } = await supabase.storage.from('preuves').createSignedUrl(path, 60 * 10)
  if (error) return alert(error.message)
  window.open(data.signedUrl, '_blank', 'noopener')
}

function PayForm({ item, onPaid, onCancel }) {
  const { user } = useAuth()
  const [reference, setReference] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (!file) return setError('Ajoutez la preuve de virement')
    if (!ALLOWED.includes(file.type)) return setError('Format accepté : PNG, JPG, WEBP ou PDF')
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Fichier trop lourd (max ${MAX_MB} Mo)`)

    setSaving(true)
    const ext = file.name.split('.').pop()
    const path = `${item.residence_id}/${user.id}/paiement-${item.id}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('preuves').upload(path, file)
    if (upErr) { setSaving(false); return setError(upErr.message) }

    const { error: updErr } = await supabase.from('virements').update({
      doc_status: 'paye',
      payment_proof_path: path,
      payment_reference: reference || null,
      paid_at: new Date().toISOString(),
      paid_by: user.id
    }).eq('id', item.id)
    if (updErr) { setSaving(false); return setError(updErr.message) }

    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/notify-virement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ virementId: item.id, event: 'paiement' }),
    }).catch(() => {})

    setSaving(false)
    onPaid()
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginTop: 10 }}>
      <input placeholder="Référence du virement (optionnel)" value={reference} onChange={e => setReference(e.target.value)} />
      <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
             onChange={e => setFile(e.target.files[0] || null)} required />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary small" type="submit" disabled={saving}>
          {saving ? 'Envoi...' : 'Confirmer le paiement'}
        </button>
        <button className="btn-secondary small" type="button" onClick={onCancel}>Annuler</button>
      </div>
      {error && <p className="error small">{error}</p>}
    </form>
  )
}

function ItemCard({ item, canManage, onChange }) {
  const [paying, setPaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const status = item.doc_status || 'en_attente'

  async function setStatus(next) {
    setBusy(true)
    const { error } = await supabase.from('virements').update({ doc_status: next }).eq('id', item.id)
    setBusy(false)
    if (error) return alert(error.message)
    onChange()
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>{item.note || (item.kind === 'devis' ? 'Devis' : 'Facture')}</h3>
        <StatusPill status={status} />
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        {canManage && <>{item.sender?.full_name || 'Société'} · </>}
        {Number(item.amount).toLocaleString('fr-MA')} MAD
        {item.reference && <> · N° {item.reference}</>}
        {' · '}{new Date(item.created_at).toLocaleDateString('fr-FR')}
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
        <button className="btn-secondary small" type="button" onClick={() => openFile(item.proof_path)}>
          Voir le {item.kind === 'devis' ? 'devis' : 'la facture'}
        </button>

        {item.payment_proof_path && (
          <button className="btn-secondary small" type="button" onClick={() => openFile(item.payment_proof_path)}>
            Voir la preuve de paiement
          </button>
        )}

        {canManage && item.kind === 'devis' && status === 'en_attente' && (
          <>
            <button className="btn-primary small" type="button" disabled={busy} onClick={() => setStatus('accepte')}>Accepter</button>
            <button className="btn-secondary small" type="button" disabled={busy} onClick={() => setStatus('refuse')}>Refuser</button>
          </>
        )}

        {canManage && item.kind === 'facture' && status !== 'paye' && !paying && (
          <button className="btn-primary small" type="button" onClick={() => setPaying(true)}>Payer par virement</button>
        )}
      </div>

      {item.paid_at && (
        <p className="small muted" style={{ margin: 0 }}>
          Payée le {new Date(item.paid_at).toLocaleDateString('fr-FR')}
          {item.payment_reference && <> · Réf. {item.payment_reference}</>}
        </p>
      )}

      {paying && <PayForm item={item} onCancel={() => setPaying(false)} onPaid={() => { setPaying(false); onChange() }} />}
    </div>
  )
}

export default function DevisFacturesPanel({ canManage = true, reloadKey = 0 }) {
  const { user, profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      let q = supabase
        .from('virements')
        .select('*, sender:profiles!virements_resident_id_fkey(full_name, phone)')
        .eq('residence_id', profile.residence_id)
        .in('kind', ['devis', 'facture'])
        .order('created_at', { ascending: false })
      const currentUserId = user?.id || profile?.id
      if (!canManage && currentUserId) q = q.eq('resident_id', currentUserId)

      let { data, error } = await q
      if (error && /relationship|virements_resident_id_fkey/i.test(error.message)) {
        let q2 = supabase.from('virements').select('*')
          .eq('residence_id', profile.residence_id)
          .in('kind', ['devis', 'facture'])
          .order('created_at', { ascending: false })
        if (!canManage && currentUserId) q2 = q2.eq('resident_id', currentUserId)
        const res = await q2
        data = res.data; error = res.error
        if (data?.length && canManage) {
          const ids = [...new Set(data.map(d => d.resident_id))]
          const { data: profs } = await supabase.from('profiles').select('id, full_name, phone').in('id', ids)
          const map = Object.fromEntries((profs || []).map(p => [p.id, p]))
          data = data.map(d => ({ ...d, sender: map[d.resident_id] }))
        }
      }
      if (!active) return
      setError(error?.message || null)
      setItems(data || [])
      setLoading(false)
    }
    if (profile?.residence_id) load()
    return () => { active = false }
  }, [profile, user, canManage, tick, reloadKey])

  const visible = items.filter(i => filter === 'all' || i.kind === filter)
  const pendingDevis = items.filter(i => i.kind === 'devis' && (i.doc_status || 'en_attente') === 'en_attente').length
  const unpaidFactures = items.filter(i => i.kind === 'facture' && i.doc_status !== 'paye').length

  return (
    <div className="panel">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0 }}>{canManage ? 'Devis & factures des sociétés' : 'Mes envois'}</h3>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {pendingDevis} devis en attente · {unpaidFactures} facture(s) à payer
          </p>
        </div>
        <div className="tabs" style={{ margin: 0, border: 'none' }}>
          {[['all', 'Tout'], ['devis', 'Devis'], ['facture', 'Factures']].map(([k, label]) => (
            <button key={k} type="button" className={'tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="muted">Chargement...</p>}
      {error && <p className="error small">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Aucun document pour le moment.</p></div>
      )}
      {!loading && visible.map(item => (
        <ItemCard key={item.id} item={item} canManage={canManage} onChange={() => setTick(t => t + 1)} />
      ))}
    </div>
  )
}
