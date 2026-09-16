import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ResidentsPanel() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteApt, setInviteApt] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, apartment_number, role, created_at')
        .eq('residence_id', profile.residence_id)
        .order('role')
      setResidents(data || [])
      setLoading(false)
    }
    if (profile?.residence_id) load()
  }, [profile])

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
      const res = await fetch('/api/invite-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          residence_id: profile.residence_id,
          apartment_number: inviteApt,
          syndic_id: profile.id
        })
      })
      const data = await res.json()

      if (data.error) {
        setInviteStatus({ ok: false, message: data.error })
      } else {
        setInviteStatus({ ok: true, message: t('residents.success') })
        setInviteEmail('')
        setInviteApt('')
      }
    } catch (err) {
      setInviteStatus({ ok: false, message: t('residents.networkError') })
    }
    setSending(false)
  }

  if (loading) return <p className="muted">{t('common.loading')}</p>

  return (
    <div className="panel">
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

      <div className="card invite-card">
        <h3>{t('residents.codeTitle')}</h3>
        <p className="muted small">{t('residents.codeSubtitle')}</p>
        <div className="invite-code-box">
          <code>{profile.residences?.invite_code}</code>
          <button className="btn-secondary small" onClick={copyCode}>{copied ? t('residents.copied') : t('residents.copy')}</button>
        </div>
      </div>

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
