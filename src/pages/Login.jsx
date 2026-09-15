import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError("L'email wla mot de passe ghalat. 3awd jarreb.")
      return
    }
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <span>Syndic Maroc</span>
        </div>
        <h1>Se connecter</h1>
        <p className="muted">Dkhol l'compte dyalk bach tsayr l'gestion dyal résidence dyalk</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
          </label>
          <label>
            Mot de passe
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Chi lhda9a...' : 'Se connecter'}
          </button>
        </form>

        <p className="muted small">
          Mazal ma3ndkch compte ? <Link to="/signup">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
