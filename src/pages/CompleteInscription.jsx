import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function CompleteInscription() {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setStatus({ ok: false, message: error.message })
      setSaving(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="center-screen">
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '400px' }}>
        <h2>{t('completeInscription.title')}</h2>
        <p className="muted small">{t('completeInscription.subtitle')}</p>
        <input
          type="password"
          placeholder={t('completeInscription.passwordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ marginTop: '12px', marginBottom: '12px' }}
        />
        <button className="btn-secondary" type="submit" disabled={saving}>
          {saving ? t('completeInscription.saving') : t('completeInscription.submit')}
        </button>
        {status && !status.ok && (
          <p className="error small" style={{ marginTop: '8px' }}>{status.message}</p>
        )}
      </form>
    </div>
  )
}
