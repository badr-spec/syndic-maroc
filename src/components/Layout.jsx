import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { activeMode, switchDatabaseMode } from '../lib/supabaseClient'
import ParametresBanqueModal from './ParametresBanqueModal'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const isAr = lang === 'ar'
  const [showBankModal, setShowBankModal] = useState(false)

  return (
    <div className="app-shell">
      {/* 1. Main Header: Stable, Clean, Never Wraps in Disorder */}
      <header className="topbar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.svg"
            alt="Syndic Maroc"
            style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{t('brand')}</strong>
          <button
            type="button"
            onClick={() => switchDatabaseMode(activeMode === 'local' ? 'cloud' : 'local')}
            title={isAr ? 'التبديل بين البيانات المحلية وسحابة Supabase' : 'Cliquer pour basculer entre données locales et Supabase Cloud'}
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              cursor: 'pointer',
              color: activeMode === 'local' ? '#15803d' : '#0369a1',
              marginLeft: '6px',
              fontWeight: 600
            }}
          >
            {isAr
              ? (activeMode === 'local' ? '🟢 محلية' : '☁️ سحابية')
              : (activeMode === 'local' ? '🟢 Données locales' : '☁️ Supabase Cloud')}
          </button>
        </div>

        <div className="topbar-right">
          {/* Language Switcher */}
          <button
            type="button"
            className="btn-secondary small"
            onClick={toggleLang}
            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
          >
            {lang === 'fr' ? 'العربية' : 'Français'}
          </button>

          {/* User Profile Chip */}
          {profile && (
            <div className="user-chip" style={{ textAlign: isAr ? 'left' : 'right' }}>
              <span className="user-name" style={{ fontSize: '0.84rem' }}>{profile.full_name}</span>
              <span className="role-badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.68rem' }}>
                {t('roles.' + profile.role)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Fixed Action Grid: Structured, Fixed on All Pages, Zero Disorder */}
      <div className="top-action-grid-wrapper">
        <div className="top-action-grid">
          {/* Tile 1: Install App Button (Highlight Emerald) */}
          <button
            type="button"
            className="action-tile-btn primary-install"
            onClick={() => window.__openInstallModal && window.__openInstallModal()}
            title={isAr ? 'تثبيت التطبيق على جهازك أو هاتفك' : 'Installer l’application sur votre téléphone'}
          >
            <span style={{ fontSize: '1rem' }}>📲</span>
            <span>{isAr ? 'تثبيت التطبيق' : 'Installer l’application'}</span>
          </button>

          {/* Tile 2: Subscriptions & Tarifs */}
          <button
            type="button"
            className="action-tile-btn"
            onClick={() => window.location.href = '/tarifs'}
            title={isAr ? 'باقات واشتراكات التطبيق' : 'Formules & Tarifs d’abonnement'}
          >
            <span>💎</span>
            <span>{isAr ? 'الاشتراكات' : 'Abonnements & Tarifs'}</span>
          </button>

          {/* Tile 3: Bank Account / RIB (for Syndic) */}
          {profile?.role === 'syndic' && (
            <button
              type="button"
              className="action-tile-btn"
              onClick={() => setShowBankModal(true)}
              title={isAr ? 'إعداد الحساب البنكي وRIB الخاص بالإقامة' : 'Configurer le compte bancaire et RIB de la résidence'}
            >
              <span>🏦</span>
              <span>{isAr ? 'الحساب البنكي' : 'Compte Bancaire & RIB'}</span>
            </button>
          )}

          {/* Tile 4: Switch Account */}
          {profile && (
            <button
              type="button"
              className="action-tile-btn"
              onClick={signOut}
              title={isAr ? 'تبديل الحساب' : 'Changer de compte utilisateur'}
            >
              <span>🔄</span>
              <span>{isAr ? 'تبديل الحساب' : 'Changer de compte'}</span>
            </button>
          )}

          {/* Tile 5: Logout */}
          {profile && (
            <button
              type="button"
              className="action-tile-btn"
              onClick={signOut}
              title={isAr ? 'تسجيل الخروج' : 'Se déconnecter'}
            >
              <span>🚪</span>
              <span>{isAr ? 'خروج' : 'Déconnexion'}</span>
            </button>
          )}
        </div>
      </div>

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
