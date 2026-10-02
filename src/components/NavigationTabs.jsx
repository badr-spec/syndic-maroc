import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import {
  ALL_AVAILABLE_TABS,
  getTabsForRole,
  removeTabFromRole,
  addTabToRole,
  resetRoleTabs
} from '../lib/gridTabsManager'

export default function NavigationTabs({ tabs, activeTab, onChangeTab, role = 'syndic' }) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const { profile } = useAuth()
  const isSuperAdmin = profile?.role === 'admin'

  const [isGridCollapsed, setIsGridCollapsed] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Allowed tab keys for this specific role
  const [allowedKeys, setAllowedKeys] = useState(() => getTabsForRole(role))

  useEffect(() => {
    setAllowedKeys(getTabsForRole(role))

    function handleTabsUpdated() {
      setAllowedKeys(getTabsForRole(role))
    }

    window.addEventListener('grid-tabs-updated', handleTabsUpdated)
    return () => window.removeEventListener('grid-tabs-updated', handleTabsUpdated)
  }, [role])

  // Active filtered tabs for this role
  const filteredTabs = tabs.filter(t => allowedKeys.includes(t.key))
  const displayTabs = filteredTabs.length > 0 ? filteredTabs : tabs

  // If active tab was removed, automatically switch to first remaining tab
  useEffect(() => {
    if (displayTabs.length > 0 && !displayTabs.some(t => t.key === activeTab)) {
      onChangeTab(displayTabs[0].key)
    }
  }, [displayTabs, activeTab, onChangeTab])

  const TAB_META = {
    charges: {
      icon: '💳',
      category: 'finances',
      shortLabel: isAr ? 'المساهمات' : 'Charges',
      desc: isAr ? 'المساهمات، المدفوعات والوصولات' : 'Cotisations, paiements et reçus'
    },
    tresorerie: {
      icon: '💰',
      category: 'finances',
      shortLabel: isAr ? 'الخزينة' : 'Caisse',
      desc: isAr ? 'سجل المداخيل، المصاريف ورصيد الصندوق' : 'Bilan de caisse et dépenses'
    },
    parking: {
      icon: '🚗',
      category: 'residence',
      shortLabel: isAr ? 'المرآب' : 'Parking',
      desc: isAr ? 'دليل الأماكن ولوحات السيارات' : 'Places et matricules'
    },
    compteurs: {
      icon: '⚡💧',
      category: 'finances',
      shortLabel: isAr ? 'العدادات' : 'Compteurs',
      desc: isAr ? 'استهلاك الماء والكهرباء وتنبيه التسربات' : 'Eau, électricité et fuites'
    },
    misedemeure: {
      icon: '⚖️',
      category: 'finances',
      shortLabel: isAr ? 'الإنذارات' : 'Mises en demeure',
      desc: isAr ? 'الإنذارات القانونية (القانون 18-00)' : 'Loi 18-00 et recouvrement'
    },
    reservations: {
      icon: '📅',
      category: 'residence',
      shortLabel: isAr ? 'الحجوزات' : 'Réservations',
      desc: isAr ? 'حجز السطح والقاعة' : 'Terrasse (stah) et salle'
    },
    assemblees: {
      icon: '🗳️',
      category: 'residence',
      shortLabel: isAr ? 'التصويت والجمع' : 'Votes & AG',
      desc: isAr ? 'الجمع العام والتصويت الإلكتروني' : 'AG et résolutions'
    },
    reclamations: {
      icon: '🚨',
      category: 'residence',
      shortLabel: isAr ? 'الأعطال' : 'Pannes',
      desc: isAr ? 'التبليغ عن الأعطال ومتابعة الصيانة' : 'Pannes et réclamations'
    },
    annonces: {
      icon: '📢',
      category: 'gestion',
      shortLabel: isAr ? 'الإعلانات' : 'Annonces',
      desc: isAr ? 'إعلانات وبلاغات الإقامة' : 'Informations et avis'
    },
    documents: {
      icon: '📁',
      category: 'gestion',
      shortLabel: isAr ? 'الوثائق' : 'Documents',
      desc: isAr ? 'القانون الداخلي، العقود والمحاضر' : 'Règlement et contrats'
    },
    residents: {
      icon: '👥',
      category: 'gestion',
      shortLabel: isAr ? 'السكان' : 'Résidents',
      desc: isAr ? 'دليل الملاك والسكان' : 'Annuaire des résidents'
    },
    immeubles: {
      icon: '🏢',
      category: 'gestion',
      shortLabel: isAr ? 'العمارات' : 'Immeubles',
      desc: isAr ? 'العمارات والشقق' : 'Gestion des blocs'
    },
    societes: {
      icon: '🛠️',
      category: 'gestion',
      shortLabel: isAr ? 'الشركات' : 'Prestataires',
      desc: isAr ? 'شركات الصيانة والفواتير' : 'Devis et factures'
    },
    virement: {
      icon: '💳',
      category: 'finances',
      shortLabel: isAr ? 'التحويل' : 'Virement & RIB',
      desc: isAr ? 'بيانات الحساب البنكي' : 'Coordonnées bancaires'
    },
    devis: {
      icon: '📄',
      category: 'gestion',
      shortLabel: isAr ? 'العروض' : 'Devis',
      desc: isAr ? 'عروض الأسعار' : 'Devis et estimations'
    },
    facture: {
      icon: '🧾',
      category: 'gestion',
      shortLabel: isAr ? 'الفواتير' : 'Facturation',
      desc: isAr ? 'فواتير الصيانة' : 'Factures de service'
    }
  }

  // Categories in sober styling
  const CATEGORIES = role === 'syndic' ? [
    { key: 'all', label: isAr ? `الكل (${displayTabs.length})` : `Tous (${displayTabs.length})` },
    { key: 'finances', label: isAr ? 'المالية' : 'Finances' },
    { key: 'residence', label: isAr ? 'الإقامة' : 'Résidence' },
    { key: 'gestion', label: isAr ? 'الإدارة' : 'Gestion' }
  ] : role === 'resident' ? [
    { key: 'all', label: isAr ? `الكل (${displayTabs.length})` : `Tous (${displayTabs.length})` },
    { key: 'finances', label: isAr ? 'مساهماتي' : 'Mes Charges' },
    { key: 'residence', label: isAr ? 'الخدمات' : 'Services' },
    { key: 'gestion', label: isAr ? 'المجتمع' : 'Vie d’Immeuble' }
  ] : [
    { key: 'all', label: isAr ? `الكل (${displayTabs.length})` : `Tous (${displayTabs.length})` }
  ]

  const activeTabObj = displayTabs.find(t => t.key === activeTab) || displayTabs[0]
  const activeMeta = TAB_META[activeTabObj?.key] || { icon: '📌', shortLabel: '', desc: '' }

  const visibleTabs = displayTabs.filter(tItem => {
    if (selectedCategory === 'all') return true
    const meta = TAB_META[tItem.key]
    return meta?.category === selectedCategory
  })

  // List of all tabs that can be added to this role
  const missingTabs = tabs.filter(t => !allowedKeys.includes(t.key))

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  function handleRemoveTab(key) {
    if (displayTabs.length <= 1) {
      showToast(isAr ? 'يجب الإبقاء على قسم واحد على الأقل' : 'Vous devez garder au moins 1 onglet')
      return
    }
    const updated = removeTabFromRole(role, key)
    setAllowedKeys(updated)
    showToast(isAr ? 'تم حذف القسم بنجاح' : 'Onglet retiré avec succès')
  }

  function handleAddTab(key) {
    const updated = addTabToRole(role, key)
    setAllowedKeys(updated)
    setShowAddMenu(false)
    showToast(isAr ? 'تمت إضافة القسم إلى الشبكة' : 'Onglet ajouté à la grille')
  }

  function handleResetTabs() {
    const updated = resetRoleTabs(role)
    setAllowedKeys(updated)
    showToast(isAr ? 'تمت استعادة الأقسام الافتراضية' : 'Onglets par défaut rétablis')
  }

  function handleSelect(key) {
    onChangeTab(key)
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        const el = document.getElementById('tab-results-anchor')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 50)
    }
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.84rem',
          fontWeight: 600,
          zIndex: 4000,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar: Active Section Headline + Grid Toggle + Admin Customization Button */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{activeMeta.icon}</span>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 600, display: 'block' }}>
              {isAr ? 'القسم النشط' : 'Section active'}
            </span>
            <strong style={{ fontSize: '0.96rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {activeTabObj?.label}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Admin Customization Toggle Button */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsCustomizing(!isCustomizing)}
              style={{
                background: isCustomizing ? '#fef2f2' : '#ffffff',
                color: isCustomizing ? '#b91c1c' : '#0369a1',
                border: isCustomizing ? '1.5px solid #ef4444' : '1px solid #bae6fd',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Gérer les onglets visibles pour ce rôle (Ajouter / Supprimer avec un clic X)"
            >
              <span>{isCustomizing ? '✕' : '⚙️'}</span>
              <span>
                {isCustomizing
                  ? (isAr ? 'إنهاء التعديل' : 'Terminer modif.')
                  : (isAr ? 'تعديل الأقسام (Admin)' : 'Personnaliser (Admin)')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsGridCollapsed(!isGridCollapsed)}
            style={{
              background: isGridCollapsed ? '#f1f5f9' : '#047857',
              color: isGridCollapsed ? '#334155' : '#ffffff',
              border: '1px solid ' + (isGridCollapsed ? '#cbd5e1' : '#047857'),
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={isAr ? 'إظهار / إخفاء شبكة الأقسام' : 'Afficher / Masquer la grille'}
          >
            <span>{isGridCollapsed ? '▦' : '▴'}</span>
            <span>
              {isGridCollapsed
                ? (isAr ? `عرض الشبكة (${displayTabs.length})` : `Ouvrir la grille (${displayTabs.length})`)
                : (isAr ? 'تصغير الشبكة' : 'Réduire la grille')}
            </span>
          </button>
        </div>
      </div>

      {/* Admin Customization Helper Banner */}
      {isCustomizing && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.82rem',
          color: '#92400e'
        }}>
          <div>
            <strong>🛠️ {isAr ? 'وضع التخصيص للمدير (Admin) :' : 'Mode Personnalisation Admin :'}</strong>{' '}
            <span>
              {isAr
                ? 'اضغط على زر (×) الأحمر في أي بطاقة لحذفها فوراً. يمكنك إضافة أي قسم مجدداً بالأسفل.'
                : 'Cliquez sur le (×) rouge d’une carte pour la masquer. Vous pouvez ajouter des onglets ci-dessous.'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleResetTabs}
              style={{
                background: '#ffffff',
                border: '1px solid #d97706',
                color: '#92400e',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ↺ {isAr ? 'استعادة الكل' : 'Rétablir tout'}
            </button>
            <button
              type="button"
              onClick={() => setIsCustomizing(false)}
              style={{
                background: '#047857',
                border: 'none',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✓ {isAr ? 'تم' : 'Terminer'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Category Filter Chips (Simple, Monochrome) */}
      {!isGridCollapsed && CATEGORIES.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '10px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {CATEGORIES.map(cat => {
            const isCatActive = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  fontSize: '0.74rem',
                  fontWeight: isCatActive ? 700 : 500,
                  cursor: 'pointer',
                  border: isCatActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: isCatActive ? '#0f172a' : '#ffffff',
                  color: isCatActive ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.1s ease'
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      )}

      {/* 3. THE GRID: Touch-Friendly, Clear Active State, with (X) for Admin */}
      {!isGridCollapsed && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: '8px',
          paddingBottom: '12px'
        }}>
          {visibleTabs.map(tItem => {
            const isActive = activeTab === tItem.key
            const meta = TAB_META[tItem.key] || { icon: '📌', shortLabel: tItem.label }
            const displayTitle = meta.shortLabel || (tItem.label || '').replace(/^[^\s]+\s+/, '')

            return (
              <div
                key={tItem.key}
                style={{ position: 'relative' }}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(tItem.key)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '10px 6px',
                    minHeight: '74px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.12s ease',
                    background: isActive ? '#f0fdf4' : '#ffffff',
                    border: isActive ? '2px solid #047857' : '1px solid #e2e8f0',
                    boxShadow: isActive ? '0 2px 6px rgba(4, 120, 87, 0.15)' : 'none'
                  }}
                >
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      top: '5px',
                      right: isAr ? 'auto' : '6px',
                      left: isAr ? '6px' : 'auto',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#047857'
                    }} />
                  )}

                  <span style={{ fontSize: '1.45rem', marginBottom: '4px', lineHeight: 1 }}>
                    {meta.icon}
                  </span>

                  <span style={{
                    fontSize: '0.74rem',
                    lineHeight: 1.15,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#047857' : '#334155',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word'
                  }}>
                    {displayTitle}
                  </span>
                </button>

                {/* ✕ One-Click Delete Button for Admin */}
                {isCustomizing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTab(tItem.key)
                    }}
                    title={isAr ? 'حذف هذا القسم بنقرة واحدة' : 'Masquer cet onglet d’un clic X'}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: isAr ? 'auto' : '-6px',
                      left: isAr ? '-6px' : 'auto',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Admin Action: Add New Tabs (when in customization mode) */}
      {isCustomizing && (
        <div style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '0.84rem', color: '#1e293b' }}>
              ➕ {isAr ? 'إضافة أقسام جديدة إلى هذا الدور :' : 'Ajouter des onglets disponibles à ce rôle :'}
            </strong>
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {showAddMenu ? (isAr ? 'إخفاء القائمة' : 'Fermer') : (isAr ? 'عرض الأقسام المتاحة' : 'Choisir un onglet')}
            </button>
          </div>

          {showAddMenu && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '6px',
              marginTop: '8px'
            }}>
              {missingTabs.length === 0 ? (
                <p className="muted small" style={{ margin: '4px 0' }}>
                  {isAr ? 'جميع الأقسام مفعلة حالياً.' : 'Tous les onglets de ce rôle sont déjà affichés.'}
                </p>
              ) : (
                missingTabs.map(t => {
                  const meta = TAB_META[t.key] || { icon: '📌', shortLabel: t.label }
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleAddTab(t.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{meta.icon}</span>
                        <strong>{meta.shortLabel || t.label}</strong>
                      </span>
                      <span style={{ color: '#047857', fontWeight: 800 }}>+ Ajouter</span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Results Anchor & Headline: Clearly indicates what opens below */}
      <div id="tab-results-anchor" style={{
        borderTop: '2px solid #f1f5f9',
        paddingTop: '10px',
        marginTop: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#047857', display: 'inline-block' }} />
          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
            {activeTabObj?.label}
          </strong>
          {activeMeta.desc && (
            <span className="muted small" style={{ fontSize: '0.76rem', color: '#64748b' }}>
              — {activeMeta.desc}
            </span>
          )}
        </div>

        <span className="muted small" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          {isAr ? `${displayTabs.length} أقسام متاحة` : `${displayTabs.length} sections`}
        </span>
      </div>
    </div>
  )
}
