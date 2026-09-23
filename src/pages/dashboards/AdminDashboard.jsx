import { useState, useEffect } from 'react'
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

  const [syndics, setSyndics] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  async function loadSyndics() {
    setLoadingList(true)
    try {
      const res = await fetch('/api/list-syndics')
      const data = await res.json()
      setSyndics(data.syndics || [])
    } catch (err) {
      console.error(err)
    }
    setLoadingList(false)
  }

  useEffect(() => {
    loadSyndics()
  }, [])

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
        loadSyndics() //🔄 عاود جيب اللائحة باش تبان السنديك الجديد
      }
    } catch (err) {
      setStatus({ ok: false, message: t('admin.networkError') })
    }
    setSending(false)
  }

  // s: le syndic (ou l'invitation pending) qu'on veut supprimer
  async function deleteSyndic(s) {
    if (!window.confirm(t('admin.deleteConfirm'))) return
    setDeletingId(s.id)
    try {
      const res = await fetch('/api/delete-syndic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 'active' 3ndo compte deja -> khasso syndic_id
          // 'pending' mazal ma-dkhalch -> khasso invitation_id
          syndic_id: s.status === 'pending' ? null : s.id,
          invitation_id: s.status === 'pending' ? s.invitation_id : null,
          admin_id: profile.id
        })
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setSyndics(prev => prev.filter(item => item.id !== s.id))
      }
    } catch (err) {
      alert(t('admin.networkError'))
    }
    setDeletingId(null)
  }

  return (
    <div className="panel">
      {/* ===== لائحة السنانديك ===== */}
      <div className="card">
        <h3>{t('admin.syndicsList')}</h3>

        {loadingList ? (
          <p className="muted small">{t('admin.loading')}</p>
        ) : syndics.length === 0 ? (
          <p className="muted small">{t('admin.noSyndics')}</p>
        ) : (
          <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px' }}>{t('admin.name')}</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>{t('admin.email')}</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>{t('admin.residence')}</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>{t('admin.status')}</th>
                <th style={{ textAlign: 'left', padding: '6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {syndics.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '6px' }}>{s.full_name || '—'}</td>
                  <td style={{ padding: '6px' }}>{s.email}</td>
                  <td style={{ padding: '6px' }}>{s.residence_name || '—'}</td>
                  <td style={{ padding: '6px' }}>
                    {s.status === 'pending' ? (
                      <span className="badge pending">{t('admin.statusPending')}</span>
                    ) : (
                      <span className="badge active">{t('admin.statusActive')}</span>
                    )}
                  </td>
                  <td style={{ padding: '6px' }}>
                    <button
                      className="btn-secondary small"
                      onClick={() => deleteSyndic(s)}
                      disabled={deletingId === s.id}
                    >
                      {deletingId === s.id ? '...' : t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== إضافة سنديك جديد ===== */}
      <div className="card invite-card" style={{ marginTop: '16px' }}>
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
