import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isDemoMode, activeMode, switchDatabaseMode } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { t } = useLanguage()
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
      setError(t('login.error'))
      return
    }
    navigate('/')
  }

  async function handleQuickLogin(demoEmail) {
    if (activeMode !== 'local') {
      localStorage.setItem('syndic_maroc_database_mode', 'local')
      window.location.reload()
      return
    }
    setEmail(demoEmail)
    setPassword('demo123456')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: 'demo' })
    setLoading(false)
    if (error) {
      setError(t('login.error'))
      return
    }
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
          <img
            src="/logo.svg"
            alt="Syndic Maroc"
            style={{ width: '68px', height: '68px', borderRadius: '14px', marginBottom: '8px', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.12)' }}
          />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064e3b', letterSpacing: '1px' }}>{t('brand')}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => window.__openInstallModal && window.__openInstallModal()}
            style={{
              flex: 1,
              background: '#ffffff',
              border: '1.5px solid #047857',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#047857',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>📲</span>
            <span>Installer l’app</span>
          </button>

          <Link
            to="/tarifs"
            style={{
              flex: 1,
              textDecoration: 'none',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>💎</span>
            <span>Tarifs & Démo</span>
          </Link>
        </div>
        <h1>{t('login.title')}</h1>
        <p className="muted">{t('login.subtitle')}</p>

        {/* Mode Selector & Quick Access */}
        <div style={{
          background: activeMode === 'local' ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${activeMode === 'local' ? '#86efac' : '#cbd5e1'}`,
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: activeMode === 'local' ? '#166534' : '#334155' }}>
              {activeMode === 'local' ? '🟢 Mode Données Locales (Complet)' : '☁️ Mode Supabase Cloud'}
            </span>
            <button
              type="button"
              onClick={() => switchDatabaseMode(activeMode === 'local' ? 'cloud' : 'local')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--zellige)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {activeMode === 'local' ? 'Passer à Supabase Cloud' : 'Basculer vers mes données locales'}
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 8px' }}>
            {activeMode === 'local' 
              ? 'Toutes vos résidences, paiements et résidents précédents sont conservés intacts ici :'
              : 'Cliquez ci-dessous pour revenir instantanément à vos données locales complètes :'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => handleQuickLogin('admin@demo.ma')}
              disabled={loading}
              style={{
                gridColumn: '1 / -1',
                background: '#fef3c7',
                borderColor: '#f59e0b',
                color: '#92400e',
                fontWeight: 700,
                padding: '8px 12px'
              }}
              title="Accès Administrateur Global : Créer, Supprimer et Modifier les mots de passe des Syndics"
            >
              🛡️ Super Admin (Gérer tous les Syndics : Add, Delete, Password)
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => handleQuickLogin('syndic@demo.ma')}
              disabled={loading}
              title="Connexion en tant que Syndic de la Résidence Al Andalous"
            >
              🏢 Syndic (Ex: Résidence Al Andalous)
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => handleQuickLogin('resident@demo.ma')}
              disabled={loading}
            >
              🏠 Résident
            </button>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => handleQuickLogin('societe@demo.ma')}
              disabled={loading}
              style={{ gridColumn: '1 / -1' }}
            >
              🛠️ Société de Service
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            {t('login.email')}
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} />
          </label>
          <label>
            {t('login.password')}
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>

        <p className="muted small" style={{ marginTop: '16px', textAlign: 'center' }}>
          {t('login.noAccount')} <Link to="/signup">{t('login.signupLink')}</Link>
        </p>
      </div>
    </div>
  )
}

