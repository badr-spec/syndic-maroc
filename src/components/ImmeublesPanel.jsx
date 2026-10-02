import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ImmeublesPanel() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [immeubles, setImmeubles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState({})
  const [sending, setSending] = useState({})
  const [status, setStatus] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('immeubles')
      .select('id, name, responsable_id, profiles:responsable_id(full_name)')
      .eq('residence_id', profile.residence_id)
      .order('name')
    setImmeubles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.residence_id) load()
  }, [profile])

  async function createImmeuble(e) {
    e.preventDefault()
    setCreating(true)
    const { error } = await supabase.from('immeubles').insert({
      residence_id: profile.residence_id,
      name: newName
    })
    if (!error) {
      setNewName('')
      await load()
    }
    setCreating(false)
  }

  async function inviteResponsable(immeubleId) {
    const email = inviteEmail[immeubleId]
    if (!email) return
    setSending(prev => ({ ...prev, [immeubleId]: true }))
    setStatus(null)

    try {
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: 'responsable_immeuble',
          residence_id: profile.residence_id,
          immeuble_id: immeubleId,
          invited_by: profile.id
        })
      })
      const data = await res.json()
      if (data.error) {
        setStatus({ ok: false, message: data.error })
      } else {
        setStatus({ ok: true, message: t('immeubles.inviteSuccess') })
        setInviteEmail(prev => ({ ...prev, [immeubleId]: '' }))
      }
    } catch (err) {
      setStatus({ ok: false, message: t('residents.networkError') })
    }
    setSending(prev => ({ ...prev, [immeubleId]: false }))
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  return (
    <div className="panel">
      <div className="card">
        <h3>{t('immeubles.addTitle')}</h3>
        <form onSubmit={createImmeuble} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            type="text"
            placeholder={t('immeubles.namePlaceholder')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <button className="btn-secondary small" type="submit" disabled={creating}>
            {creating ? t('immeubles.creating') : t('immeubles.create')}
          </button>
        </form>
      </div>

      {status && (
        <p className={status.ok ? 'success small' : 'error small'}>{status.message}</p>
      )}

      <div className="card">
        <h3>{t('immeubles.listTitle')} ({immeubles.length})</h3>
        {immeubles.map(im => (
          <div key={im.id} className="invite-card" style={{ marginTop: '12px' }}>
            <strong>{im.name}</strong>
            <p className="muted small">
              {im.profiles?.full_name
                ? t('immeubles.responsableIs') + ' ' + im.profiles.full_name
                : t('immeubles.noResponsable')}
            </p>
            {!im.responsable_id && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="email"
                  placeholder={t('residents.emailPlaceholder')}
                  value={inviteEmail[im.id] || ''}
                  onChange={e => setInviteEmail(prev => ({ ...prev, [im.id]: e.target.value }))}
                />
                <button
                  className="btn-secondary small"
                  onClick={() => inviteResponsable(im.id)}
                  disabled={sending[im.id]}
                >
                  {sending[im.id] ? t('residents.sending') : t('immeubles.inviteResponsable')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
