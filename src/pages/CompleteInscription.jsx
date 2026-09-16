import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function CompleteInscription() {
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
        <h2>Terminer l'inscription</h2>
        <p className="muted small">Choisissez votre mot de passe pour acceder a votre compte.</p>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ marginTop: '12px', marginBottom: '12px' }}
        />
        <button className="btn-secondary" type="submit" disabled={saving}>
          {saving ? 'Enregistrement' : 'Confirmer'}
        </button>
        {status && !status.ok && (
          <p className="error small" style={{ marginTop: '8px' }}>{status.message}</p>
        )}
      </form>
    </div>
  )
}
