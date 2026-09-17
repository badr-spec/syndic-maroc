import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CompleteInscription from './pages/CompleteInscription'
import ResidentDashboard from './pages/dashboards/ResidentDashboard'
import SyndicDashboard from './pages/dashboards/SyndicDashboard'
import SocieteDashboard from './pages/dashboards/SocieteDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'

function Gate({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="center-screen">Chargement...</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function Dashboard() {
  const { profile, loading } = useAuth()
  if (loading || !profile) return <div className="center-screen">Chargement...</div>

  return (
    <Layout>
      {profile.role === 'admin' && <AdminDashboard />}
      {profile.role === 'resident' && <ResidentDashboard />}
      {profile.role === 'syndic' && <SyndicDashboard />}
      {(profile.role === 'societe' || profile.role === 'societe_externe' || profile.role === 'responsable_immeuble') && <SocieteDashboard />}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
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
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
