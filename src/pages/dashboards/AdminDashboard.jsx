import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { isDemoMode, activeMode, supabase } from '../../lib/supabaseClient'
import {
  ALL_AVAILABLE_TABS,
  getCustomTabsConfig,
  removeTabFromRole,
  addTabToRole,
  resetRoleTabs
} from '../../lib/gridTabsManager'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'
  const [adminSection, setAdminSection] = useState('syndics') // 'syndics' | 'grilles'
  const [selectedRoleForGrid, setSelectedRoleForGrid] = useState('syndic') // 'syndic' | 'resident' | 'societe'
  const [gridTabsCfg, setGridTabsCfg] = useState(() => getCustomTabsConfig())
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [residenceName, setResidenceName] = useState('')
  const [initialPassword, setInitialPassword] = useState('123456')
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const [syndics, setSyndics] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [passwordModalSyndic, setPasswordModalSyndic] = useState(null)
  const [newPasswordVal, setNewPasswordVal] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState(null)

  function openPasswordModal(s) {
    setPasswordModalSyndic(s)
    setNewPasswordVal('')
    setPasswordFeedback(null)
  }

  async function saveNewPassword(e) {
    e.preventDefault()
    if (!newPasswordVal.trim()) return
    setSavingPassword(true)
    setPasswordFeedback(null)

    if (isDemoMode) {
      try {
        const users = JSON.parse(localStorage.getItem('syndic_maroc_users') || '[]')
        const targetEmail = (passwordModalSyndic.email || '').toLowerCase()
        const userIdx = users.findIndex(u => (u.email && u.email.toLowerCase() === targetEmail) || u.id === passwordModalSyndic.id)
        if (userIdx >= 0) {
          users[userIdx].password = newPasswordVal
        } else {
          users.push({ id: passwordModalSyndic.id, email: targetEmail, password: newPasswordVal })
        }
        localStorage.setItem('syndic_maroc_users', JSON.stringify(users))
        setPasswordFeedback({ ok: true, message: `✅ Mot de passe mis à jour avec succès pour "${passwordModalSyndic.full_name}" !` })
        setTimeout(() => {
          setPasswordModalSyndic(null)
          setPasswordFeedback(null)
        }, 1500)
      } catch (err) {
        setPasswordFeedback({ ok: false, message: 'Erreur lors de la mise à jour' })
      }
      setSavingPassword(false)
      return
    }

    // Cloud Mode
    try {
      const res = await fetch('/api/update-syndic-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syndic_id: passwordModalSyndic.id,
          email: passwordModalSyndic.email,
          new_password: newPasswordVal,
          admin_id: profile.id
        })
      })
      const data = await res.json()
      if (data.error) {
        setPasswordFeedback({ ok: false, message: data.error })
      } else {
        setPasswordFeedback({ ok: true, message: `✅ Mot de passe modifié avec succès !` })
        setTimeout(() => {
          setPasswordModalSyndic(null)
          setPasswordFeedback(null)
        }, 1500)
      }
    } catch (err) {
      setPasswordFeedback({ ok: false, message: 'Erreur réseau lors de la mise à jour' })
    }
    setSavingPassword(false)
  }

  function getLocalSyndics() {
    try {
      const profs = JSON.parse(localStorage.getItem('syndic_maroc_profiles') || '[]')
      const reses = JSON.parse(localStorage.getItem('syndic_maroc_residences') || '[]')
      const resMap = Object.fromEntries(reses.map(r => [r.id, r.name]))
      return profs
        .filter(p => p.role === 'syndic')
        .map(p => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email || (p.id === 'demo-user-syndic' ? 'syndic@demo.ma' : `${p.id}@syndic.ma`),
          residence_name: resMap[p.residence_id] || 'Résidence Al Andalous',
          status: 'active'
        }))
    } catch {
      return []
    }
  }

  function saveLocalSyndic(name, emailAddr, resName, pass) {
    const resId = 'res-' + Math.random().toString(36).substring(2, 9)
    const newRes = {
      id: resId,
      name: resName,
      city: 'Casablanca',
      invite_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      created_at: new Date().toISOString()
    }
    const syndicId = 'syndic-' + Math.random().toString(36).substring(2, 9)
    const newProfile = {
      id: syndicId,
      full_name: name,
      role: 'syndic',
      email: emailAddr.trim().toLowerCase(),
      residence_id: resId,
      created_at: new Date().toISOString()
    }

    const existingRes = JSON.parse(localStorage.getItem('syndic_maroc_residences') || '[]')
    existingRes.unshift(newRes)
    localStorage.setItem('syndic_maroc_residences', JSON.stringify(existingRes))

    const existingProf = JSON.parse(localStorage.getItem('syndic_maroc_profiles') || '[]')
    existingProf.unshift(newProfile)
    localStorage.setItem('syndic_maroc_profiles', JSON.stringify(existingProf))

    const existingUsers = JSON.parse(localStorage.getItem('syndic_maroc_users') || '[]')
    existingUsers.push({ id: syndicId, email: emailAddr.trim().toLowerCase(), password: pass })
    localStorage.setItem('syndic_maroc_users', JSON.stringify(existingUsers))

    return { newRes, newProfile }
  }

  async function loadSyndics() {
    setLoadingList(true)
    if (isDemoMode) {
      setSyndics(getLocalSyndics())
      setLoadingList(false)
      return
    }

    try {
      const res = await fetch('/api/list-syndics')
      const data = await res.json()
      if (data.syndics && data.syndics.length > 0) {
        setSyndics(data.syndics)
      } else {
        // Fallback: try querying supabase directly
        const { data: dbProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone, residence_id, residences:residence_id(name)')
          .eq('role', 'syndic')
        if (dbProfiles?.length) {
          setSyndics(dbProfiles.map(p => ({
            id: p.id,
            full_name: p.full_name,
            email: p.id,
            residence_name: p.residences?.name || '—',
            status: 'active'
          })))
        } else {
          setSyndics(getLocalSyndics())
        }
      }
    } catch (err) {
      console.error(err)
      setSyndics(getLocalSyndics())
    }
    setLoadingList(false)
  }

  useEffect(() => {
    loadSyndics()
  }, [])

  async function createSyndic(e) {
    e.preventDefault()
    setSending(true)
    setStatus(null)

    // Si on est en mode local (ou si l'utilisateur le souhaite)
    if (isDemoMode) {
      saveLocalSyndic(fullName, email, residenceName, initialPassword)
      setStatus({
        ok: true,
        message: `✅ Syndic "${fullName}" créé avec succès ! Il peut se connecter avec l'email "${email}" et mot de passe "${initialPassword}".`
      })
      setEmail('')
      setFullName('')
      setResidenceName('')
      loadSyndics()
      setSending(false)
      return
    }

    // Mode Cloud (Vercel + Supabase)
    try {
      const res = await fetch('/api/invite-syndic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          residence_name: residenceName,
          admin_id: profile.id,
          password: initialPassword
        })
      })
      const data = await res.json()

      if (data.error) {
        setStatus({
          ok: false,
          message: data.error,
          canFallbackLocal: true
        })
      } else {
        setStatus({
          ok: true,
          message: `✅ Syndic créé avec succès ! Identifiants: ${email} / ${initialPassword}`
        })
        setEmail('')
        setFullName('')
        setResidenceName('')
        loadSyndics()
      }
    } catch (err) {
      setStatus({
        ok: false,
        message: t('admin.networkError') || "Erreur de connexion",
        canFallbackLocal: true
      })
    }
    setSending(false)
  }

  function handleCreateLocallyNow() {
    saveLocalSyndic(fullName, email, residenceName, initialPassword)
    setStatus({
      ok: true,
      message: `✅ Syndic "${fullName}" créé avec succès en mode local ! Il peut se connecter avec "${email}" et mot de passe "${initialPassword}".`
    })
    setEmail('')
    setFullName('')
    setResidenceName('')
    loadSyndics()
  }

  // s: le syndic (ou l'invitation pending) qu'on veut supprimer
  async function deleteSyndic(s) {
    if (!window.confirm(t('admin.deleteConfirm') || 'Confirmer la suppression de ce syndic ?')) return
    setDeletingId(s.id)

    if (isDemoMode) {
      try {
        const profs = JSON.parse(localStorage.getItem('syndic_maroc_profiles') || '[]').filter(p => p.id !== s.id)
        localStorage.setItem('syndic_maroc_profiles', JSON.stringify(profs))
        setSyndics(prev => prev.filter(item => item.id !== s.id))
      } catch (err) {
        console.error(err)
      }
      setDeletingId(null)
      return
    }

    try {
      const res = await fetch('/api/delete-syndic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syndic_id: s.status === 'pending' ? null : s.id,
          invitation_id: s.status === 'pending' ? s.invitation_id : null,
          admin_id: profile.id
        })
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        setSyndics(prev => prev.filter(item => item.id !== s.id))
      }
    } catch (err) {
      alert(t('admin.networkError'))
    }
    setDeletingId(null)
  }

  const activeTabsForRole = gridTabsCfg[selectedRoleForGrid] || []
  const availableTabsForRole = Object.keys(ALL_AVAILABLE_TABS).filter(k => !activeTabsForRole.includes(k))

  function handleAdminRemoveTab(role, key) {
    if (activeTabsForRole.length <= 1) {
      alert(isAr ? 'يجب الإبقاء على قسم واحد على الأقل' : 'Vous devez garder au moins 1 onglet dans cette grille')
      return
    }
    const updated = removeTabFromRole(role, key)
    setGridTabsCfg(getCustomTabsConfig())
  }

  function handleAdminAddTab(role, key) {
    addTabToRole(role, key)
    setGridTabsCfg(getCustomTabsConfig())
  }

  function handleAdminReset(role) {
    resetRoleTabs(role)
    setGridTabsCfg(getCustomTabsConfig())
  }

  return (
    <div className="panel">
      {/* Top Admin Section Switcher */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: '#f1f5f9',
        padding: '6px',
        borderRadius: '12px'
      }}>
        <button
          type="button"
          onClick={() => setAdminSection('syndics')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: adminSection === 'syndics' ? '#ffffff' : 'transparent',
            color: adminSection === 'syndics' ? '#047857' : '#475569',
            boxShadow: adminSection === 'syndics' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>👥</span>
          <span>{isAr ? 'إدارة السنانديك والحسابات' : 'Gestion des Syndics & Accès'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSection('grilles')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: adminSection === 'grilles' ? '#ffffff' : 'transparent',
            color: adminSection === 'grilles' ? '#047857' : '#475569',
            boxShadow: adminSection === 'grilles' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🎛️</span>
          <span>{isAr ? 'التحكم في شبكات الأقسام (Syndic / Résident / Société)' : 'Personnaliser les Grilles (Syndic / Résident / Société)'}</span>
        </button>
      </div>

      {adminSection === 'grilles' ? (
        /* ===== SECTION PERSONNALISATION DES GRILLES ===== */
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                🎛️ {isAr ? 'التحكم في الأقسام المعروضة لكل دور' : 'Personnalisation des Grilles & Menus'}
              </h3>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                {isAr
                  ? 'بصفتك مدير عام، يمكنك إضافة أو حذف أي قسم بنقرة واحدة (×) للسكان، السنديك والشركات.'
                  : 'En tant qu’administrateur, vous pouvez masquer (✕) ou ajouter (+) n’importe quel onglet pour chaque profil.'}
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary small"
              onClick={() => handleAdminReset(selectedRoleForGrid)}
              title="Rétablir la configuration d'origine pour ce rôle"
            >
              ↺ {isAr ? 'استعادة الافتراضي' : 'Rétablir par défaut'}
            </button>
          </div>

          {/* Role Chooser Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { key: 'syndic', label: isAr ? '🏢 فضاء السنديك' : '🏢 Grille Syndic', count: (gridTabsCfg.syndic || []).length },
              { key: 'resident', label: isAr ? '🏠 فضاء الساكن' : '🏠 Grille Résident', count: (gridTabsCfg.resident || []).length },
              { key: 'societe', label: isAr ? '🛠️ فضاء شركة الخدمات' : '🛠️ Grille Société', count: (gridTabsCfg.societe || []).length }
            ].map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedRoleForGrid(r.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedRoleForGrid === r.key ? '2px solid #047857' : '1px solid #cbd5e1',
                  background: selectedRoleForGrid === r.key ? '#f0fdf4' : '#ffffff',
                  color: selectedRoleForGrid === r.key ? '#047857' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{r.label}</span>
                <span style={{
                  background: selectedRoleForGrid === r.key ? '#047857' : '#e2e8f0',
                  color: selectedRoleForGrid === r.key ? '#ffffff' : '#475569',
                  borderRadius: '12px',
                  padding: '2px 7px',
                  fontSize: '0.72rem'
                }}>
                  {r.count}
                </span>
              </button>
            ))}
          </div>

          {/* 1. Active Modules in Grid (Click X to remove) */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.96rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              {isAr ? 'الأقسام المفعلة والظاهرة حالياً في الشبكة :' : 'Onglets actifs (visibles dans la grille pour ce rôle) :'}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '10px'
            }}>
              {activeTabsForRole.map(tabKey => {
                const item = ALL_AVAILABLE_TABS[tabKey] || { labelFr: tabKey, labelAr: tabKey, icon: '📌' }
                return (
                  <div
                    key={tabKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#ffffff',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isAr ? item.labelAr : item.labelFr}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdminRemoveTab(selectedRoleForGrid, tabKey)}
                      title={isAr ? 'حذف بنقرة واحدة (×)' : 'Retirer d’un clic (✕)'}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                    >
                      ✕ {isAr ? 'حذف' : 'Retirer'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. Inactive Modules Available to Add (Click + to add) */}
          {availableTabsForRole.length > 0 && (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.96rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>➕</span>
                {isAr ? 'أقسام إضافية متاحة للتفعيل بنقرة واحدة :' : 'Onglets disponibles à ajouter d’un clic (+) :'}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '10px'
              }}>
                {availableTabsForRole.map(tabKey => {
                  const item = ALL_AVAILABLE_TABS[tabKey] || { labelFr: tabKey, labelAr: tabKey, icon: '📌' }
                  return (
                    <div
                      key={tabKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                        <strong style={{ fontSize: '0.82rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isAr ? item.labelAr : item.labelFr}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdminAddTab(selectedRoleForGrid, tabKey)}
                        title={isAr ? 'إضافة إلى الشبكة' : 'Ajouter à la grille'}
                        style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #86efac',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                      >
                        + {isAr ? 'تفعيل' : 'Activer'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== SECTION GESTION DES SYNDICS ===== */
        <>
          {/* ===== لائحة السنانديك ===== */}
          <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0 }}>{t('admin.syndicsList')} ({syndics.length})</h3>
          <span className="badge small" style={{ background: isDemoMode ? '#ecfdf5' : '#eff6ff', color: isDemoMode ? '#047857' : '#1d4ed8' }}>
            {isDemoMode ? '🟢 Mode Données Locales' : '☁️ Mode Supabase Cloud'}
          </span>
        </div>

        {loadingList ? (
          <p className="muted small" style={{ marginTop: 12 }}>{t('admin.loading')}</p>
        ) : syndics.length === 0 ? (
          <p className="muted small" style={{ marginTop: 12 }}>{t('admin.noSyndics')}</p>
        ) : (
          <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px' }}>{t('admin.name')}</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>{t('admin.email')}</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>{t('admin.residence')}</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>{t('admin.status')}</th>
                <th style={{ textAlign: 'left', padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {syndics.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}><strong>{s.full_name || '—'}</strong></td>
                  <td style={{ padding: '8px' }}>{s.email}</td>
                  <td style={{ padding: '8px' }}>{s.residence_name || '—'}</td>
                  <td style={{ padding: '8px' }}>
                    {s.status === 'pending' ? (
                      <span className="badge pending">{t('admin.statusPending')}</span>
                    ) : (
                      <span className="badge active">{t('admin.statusActive')}</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn-secondary small"
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        onClick={() => openPasswordModal(s)}
                        title="Changer le mot de passe de ce syndic"
                      >
                        🔑 Mot de passe
                      </button>
                      <button
                        className="btn-secondary small"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#b91c1c' }}
                        onClick={() => deleteSyndic(s)}
                        disabled={deletingId === s.id}
                        title="Supprimer ce syndic"
                      >
                        {deletingId === s.id ? '...' : '🗑️ ' + t('admin.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== إضافة سنديك جديد ===== */}
      <div className="card invite-card" style={{ marginTop: '20px' }}>
        <h3>{t('admin.createSyndic')}</h3>
        <p className="muted small" style={{ margin: '4px 0 12px' }}>
          Créez le compte Syndic et son affectation à une résidence. Le syndic pourra se connecter avec son email et le mot de passe défini.
        </p>

        <form onSubmit={createSyndic} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label className="small muted">Nom complet du syndic</label>
            <input
              type="text"
              placeholder={t('admin.fullNamePlaceholder') || "Ex: Reda Syndic"}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="small muted">Email du syndic</label>
            <input
              type="email"
              placeholder={t('admin.emailPlaceholder') || "syndic@email.com"}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="small muted">Nom de la Résidence</label>
            <input
              type="text"
              placeholder={t('admin.residenceNamePlaceholder') || "Ex: Cooperative Nahda"}
              value={residenceName}
              onChange={e => setResidenceName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="small muted">Mot de passe initial</label>
            <input
              type="text"
              placeholder="Ex: 123456"
              value={initialPassword}
              onChange={e => setInitialPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
            <button className="btn-primary" type="submit" disabled={sending}>
              {sending ? t('admin.sending') : '➕ Créer le syndic'}
            </button>
          </div>
        </form>

        {status && (
          <div style={{ marginTop: '14px', padding: '12px', borderRadius: '8px', background: status.ok ? '#ecfdf5' : '#fef2f2', border: `1px solid ${status.ok ? '#a7f3d0' : '#fecaca'}` }}>
            <p className={status.ok ? 'success small' : 'error small'} style={{ margin: 0 }}>
              {status.message}
            </p>
            {status.canFallbackLocal && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary small"
                  style={{ background: '#059669', color: '#fff', border: 'none' }}
                  onClick={handleCreateLocallyNow}
                >
                  ⚡ Créer ce syndic en mode local immédiat (Fonctionne à 100%)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )}

      {/* Modal Changement Mot de Passe */}
      {passwordModalSyndic && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>🔑 Modifier le mot de passe</h3>
            <p className="small muted" style={{ margin: '0 0 16px' }}>
              Nouveau mot de passe pour <strong>{passwordModalSyndic.full_name}</strong> ({passwordModalSyndic.email}) :
            </p>

            <form onSubmit={saveNewPassword}>
              <div style={{ marginBottom: '16px' }}>
                <label className="small muted" style={{ display: 'block', marginBottom: '6px' }}>Nouveau mot de passe</label>
                <input
                  type="text"
                  placeholder="Ex: nouveau123"
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>

              {passwordFeedback && (
                <p className={passwordFeedback.ok ? 'success small' : 'error small'} style={{ marginBottom: '12px' }}>
                  {passwordFeedback.message}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={() => setPasswordModalSyndic(null)}
                  disabled={savingPassword}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary small"
                  disabled={savingPassword || !newPasswordVal.trim()}
                >
                  {savingPassword ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
