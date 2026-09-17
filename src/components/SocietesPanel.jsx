import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function SocietesPanel() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [societes, setSocietes] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, created_at')
        .eq('residence_id', profile.residence_id)
        .eq('role', 'societe_externe')
        .order('created_at')
      setSocietes(data || [])
      setLoading(false)
    }
    if (profile?.residence_id) load()
  }, [profile])

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

  return (
    <div className="panel">
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

      <div className="card">
        <h3>{t('societes.listTitle')} ({societes.length})</h3>
        <table className="mini-table">
          <thead>
            <tr><th>{t('residents.tableName')}</th><th>{t('residents.tablePhone')}</th></tr>
          </thead>
          <tbody>
            {societes.map(s => (
              <tr key={s.id}>
                <td>{s.full_name}</td>
                <td>{s.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
