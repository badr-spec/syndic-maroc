import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [residenceName, setResidenceName] = useState('')
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  async function createSyndic(e) {
    e.preventDefault()
    setSending(true)
    setStatus(null)

    try {
      const res = await fetch('/api/invite-syndic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          residence_name: residenceName,
          admin_id: profile.id
        })
      })
      const data = await res.json()

      if (data.error) {
        setStatus({ ok: false, message: data.error })
      } else {
        setStatus({ ok: true, message: t('admin.success') })
        setEmail('')
        setFullName('')
        setResidenceName('')
      }
    } catch (err) {
      setStatus({ ok: false, message: t('admin.networkError') })
    }
    setSending(false)
  }

  return (
    <div className="panel">
      <div className="card invite-card">
        <h3>{t('admin.createSyndic')}</h3>
        <p className="muted small">{t('admin.subtitle')}</p>
        <form onSubmit={createSyndic} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <input
            type="text"
            placeholder={t('admin.fullNamePlaceholder')}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder={t('admin.emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder={t('admin.residenceNamePlaceholder')}
            value={residenceName}
            onChange={e => setResidenceName(e.target.value)}
            required
          />
          <button className="btn-secondary small" type="submit" disabled={sending}>
            {sending ? t('admin.sending') : t('admin.submit')}
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
