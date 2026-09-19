import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const { t, lang, toggleLang } = useLanguage()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">SM</div>
          <span>{t('brand')}</span>
        </div>
        <div className="topbar-right">
          <button className="btn-secondary small" onClick={toggleLang}>
            {lang === 'fr' ? 'العربية' : 'Français'}
          </button>
          {profile && (
            <>
              <div className="user-chip">
                <span className="user-name">{profile.full_name}</span>
                <span className="role-badge">{t('roles.' + profile.role)}</span>
              </div>
              <button className="btn-secondary small" onClick={signOut}>
                {t('common.switchAccount') || 'Se connecter (autre compte)'}
              </button>
              <button className="btn-secondary small" onClick={signOut}>{t('common.logout')}</button>
            </>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
