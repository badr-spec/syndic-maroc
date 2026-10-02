import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import InstallPwaBanner from './components/InstallPwaBanner'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CompleteInscription from './pages/CompleteInscription'
import MarketingPricingPage from './pages/MarketingPricingPage'
import ResidentDashboard from './pages/dashboards/ResidentDashboard'
import SyndicDashboard from './pages/dashboards/SyndicDashboard'
import SocieteDashboard from './pages/dashboards/SocieteDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'

function Gate({ children }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#0f172a'
      }}>
        <img
          src="/logo.svg"
          alt="Syndic Maroc"
          style={{ width: '48px', height: '48px', borderRadius: '10px', marginBottom: '12px' }}
        />
        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
          Chargement de Syndic Maroc...
        </span>
      </div>
    )
  }
  if (!session) return <Navigate to="/tarifs" replace />
  return children
}

function Dashboard() {
  const { profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#0f172a'
      }}>
        <img
          src="/logo.svg"
          alt="Syndic Maroc"
          style={{ width: '48px', height: '48px', borderRadius: '10px', marginBottom: '12px' }}
        />
        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
          Ouverture de votre résidence...
        </span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <p style={{ color: '#64748b', marginBottom: '12px' }}>Session expirée ou profil introuvable.</p>
        <button
          type="button"
          onClick={signOut}
          style={{ background: '#047857', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Retour à la page d'accueil
        </button>
      </div>
    )
  }

  return (
    <Layout>
      {profile.role === 'admin' && <AdminDashboard />}
      {profile.role === 'resident' && <ResidentDashboard />}
      {(profile.role === 'syndic' || !profile.role) && <SyndicDashboard />}
      {(profile.role === 'societe' ||
        profile.role === 'societe_externe' ||
        profile.role === 'responsable_immeuble') && <SocieteDashboard />}
    </Layout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <InstallPwaBanner />
            <Routes>
              <Route path="/tarifs" element={<MarketingPricingPage />} />
              <Route path="/pricing" element={<MarketingPricingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/complete-inscription" element={<CompleteInscription />} />
              <Route
                path="/"
                element={
                  <Gate>
                    <Dashboard />
                  </Gate>
                }
              />
              <Route path="*" element={<Navigate to="/tarifs" replace />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
