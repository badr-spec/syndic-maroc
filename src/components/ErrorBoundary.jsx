import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#0f172a',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <img
            src="/logo.svg"
            alt="Syndic Maroc"
            style={{ width: '64px', height: '64px', borderRadius: '12px', marginBottom: '16px' }}
          />
          <h2 style={{ fontSize: '1.4rem', margin: '0 0 8px 0', color: '#064e3b' }}>
            Application Syndic Maroc
          </h2>
          <p style={{ color: '#64748b', maxWidth: '420px', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
            Une mise à jour ou un rechargement est nécessaire pour actualiser vos données.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                localStorage.clear()
                window.location.href = '/login'
              }}
              style={{
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              🔄 Recharger l’application
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/tarifs'
              }}
              style={{
                background: '#ffffff',
                color: '#047857',
                border: '1.5px solid #047857',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              💎 Voir les Tarifs & Abonnements
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
