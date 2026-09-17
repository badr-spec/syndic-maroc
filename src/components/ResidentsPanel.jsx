import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ResidentsPanel({ filterImmeubleId = null }) {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [residents, setResidents] = useState([])
  const [immeubles, setImmeubles] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteApt, setInviteApt] = useState('')
  const [inviteImmeuble, setInviteImmeuble] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const canInvite = profile.role === 'syndic'

  useEffect(() => {
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

      if (canInvite) {
        const { data: immData } = await supabase
          .from('immeubles')
          .select('id, name')
          .eq('residence_id', profile.residence_id)
        setImmeubles(immData || [])
      }

      setLoading(false)
    }
    if (profile?.residence_id) load()
  }, [profile, filterImmeubleId])

  function copyCode() {
    navigator.clipboard.writeText(profile.residences?.invite_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      }
    } catch (err) {
      setInviteStatus({ ok: false, message: t('residents.networkError') })
    }
    setSending(false)
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  return (
    <div className="panel">
      {canInvite && (
        <div className="card invite-card">
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
        </div>
      )}

      {canInvite && (
        <div className="card invite-card">
          <h3>{t('residents.codeTitle')}</h3>
          <p className="muted small">{t('residents.codeSubtitle')}</p>
          <div className="invite-code-box">
            <code>{profile.residences?.invite_code}</code>
            <button className="btn-secondary small" onClick={copyCode}>{copied ? t('residents.copied') : t('residents.copy')}</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{t('residents.membersTitle')} ({residents.length})</h3>
        <table className="mini-table">
          <thead>
            <tr><th>{t('residents.tableName')}</th><th>{t('residents.tableRole')}</th><th>{t('residents.tableApartment')}</th><th>{t('residents.tablePhone')}</th></tr>
          </thead>
          <tbody>
            {residents.map(r => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{t('roles.' + r.role)}</td>
                <td>{r.apartment_number || '—'}</td>
                <td>{r.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
