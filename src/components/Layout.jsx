import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  resident: 'Résident',
  syndic: 'Responsable syndic',
  societe: 'Société externe'
}

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <span>Syndic Maroc</span>
        </div>
        <div className="topbar-right">
          {profile && (
            <>
              <div className="user-chip">
                <span className="user-name">{profile.full_name}</span>
                <span className="role-badge">{ROLE_LABELS[profile.role]}</span>
              </div>
              <button className="btn-secondary small" onClick={signOut}>Déconnexion</button>
            </>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
