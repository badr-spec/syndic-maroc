import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { activeMode, switchDatabaseMode } from '../lib/supabaseClient'
import ParametresBanqueModal from './ParametresBanqueModal'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const [showBankModal, setShowBankModal] = useState(false)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.svg"
            alt="Syndic Maroc"
            style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <span>{t('brand')}</span>
          <button
            type="button"
            onClick={() => switchDatabaseMode(activeMode === 'local' ? 'cloud' : 'local')}
            title={lang === 'ar' ? 'التبديل بين البيانات المحلية وسحابة Supabase' : 'Cliquer pour basculer entre données locales et Supabase Cloud'}
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
              color: activeMode === 'local' ? '#15803d' : '#0369a1',
              marginLeft: '8px',
              fontWeight: 600
            }}
          >
            {lang === 'ar'
              ? (activeMode === 'local' ? '🟢 محلية' : '☁️ سحابية')
              : (activeMode === 'local' ? '🟢 Données locales' : '☁️ Supabase Cloud')}
          </button>
        </div>
        <div className="topbar-right">
          <button
            type="button"
            className="btn-secondary small"
            onClick={() => window.__openInstallModal && window.__openInstallModal()}
            style={{
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ffffff',
              borderColor: '#047857',
              color: '#047857'
            }}
            title={lang === 'ar' ? 'تثبيت التطبيق على جهازك' : 'Installer l’application'}
          >
            <span>📲</span>
            <span>{lang === 'ar' ? 'تثبيت التطبيق' : 'Installer l’app'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary small"
            onClick={() => window.location.href = '/tarifs'}
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={lang === 'ar' ? 'باقات واشتراكات التطبيق' : 'Formules & Tarifs d’abonnement'}
          >
            <span>💎</span>
            <span>{lang === 'ar' ? 'الاشتراكات' : 'Abonnements'}</span>
          </button>

          {profile?.role === 'syndic' && (
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => setShowBankModal(true)}
              style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title={lang === 'ar' ? 'إعداد الحساب البنكي وRIB الخاص بالإقامة' : 'Configurer le compte bancaire et RIB de la résidence'}
            >
              {lang === 'ar' ? '🏦 الحساب البنكي' : '🏦 Compte Bancaire'}
            </button>
          )}
          <button className="btn-secondary small" onClick={toggleLang}>
            {lang === 'fr' ? 'العربية' : 'Français'}
          </button>
          {profile && (
            <>
              <div className="user-chip">
                <span className="user-name">{profile.full_name}</span>
                <span className="role-badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                  {t('roles.' + profile.role)}
                </span>
              </div>
              <button className="btn-secondary small" onClick={signOut}>
                {t('common.switchAccount') || 'Changer'}
              </button>
              <button className="btn-secondary small" onClick={signOut}>{t('common.logout')}</button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>

      {showBankModal && profile?.residences && (
        <ParametresBanqueModal
          residence={profile.residences}
          onSave={() => window.location.reload()}
          onClose={() => setShowBankModal(false)}
        />
      )}
    </div>
  )
}
