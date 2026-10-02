import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function AssembleesPanel({ canManage }) {
  const { profile, user } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const storageKey = `syndic_ag_${profile.residence_id || 'default'}`

  const [assemblees, setAssemblees] = useState([])
  const [selectedAg, setSelectedAg] = useState(null)
  const [showNewAgModal, setShowNewAgModal] = useState(false)
  const [showPvModal, setShowPvModal] = useState(null)

  // New AG Form
  const [newAg, setNewAg] = useState({
    title: isAr ? 'الجمع العام العادي السنوي — موسم 2026/2027' : 'Assemblée Générale Ordinaire — Exercice 2026/2027',
    type: 'Ordinaire',
    date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    time: '19:30',
    location: isAr ? 'مدخل الإقامة والقاعة المشتركة' : 'Hall d’entrée & Salle commune de la résidence',
    resolutions: isAr ? [
      'المصادقة على التقرير المالي وإبراء ذمة السنديك المنتهية ولايته.',
      'المصادقة على ميزانية التسيير التقديرية للموسم القادم.',
      'التصويت على صباغة مدرجات العمارة (عرض أسعار 18 500 درهم).'
    ] : [
      'Approbation des comptes de l’exercice écoulé et quitus au syndic.',
      'Validation du budget prévisionnel pour l’année à venir.',
      'Vote des travaux de peinture des cages d’escaliers (Devis 18 500 DH).'
    ]
  })
  const [newResolutionText, setNewResolutionText] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAssemblees(parsed)
        if (parsed.length > 0) setSelectedAg(parsed[0])
        return
      } catch (e) {}
    }

    const initialAg = [
      {
        id: 'ag-2026-1',
        title: isAr ? 'الجمع العام العادي السنوي 2026' : 'Assemblée Générale Ordinaire Annuelle 2026',
        type: 'Ordinaire',
        date: '2026-10-15',
        time: '20:00',
        location: isAr ? 'مدخل العمارة الرئيسي بإقامة الأندلس' : 'Hall principal de la résidence Al Andalous',
        status: 'open',
        president: profile.full_name || 'Mohammed Benjelloun',
        secretaire: 'Karim El Amrani',
        total_coproprietaires: 24,
        resolutions: [
          {
            id: 'res-1',
            number: 1,
            title: isAr ? 'المصادقة على الحسابات السنوية لموسم 2025/2026 وإبراء ذمة السنديك' : 'Approbation des comptes de l’exercice 2025/2026 et quitus au syndic',
            description: isAr ? 'عرض الحصيلة المالية، تبرير المصاريف وتوضيح الرصيد المتبقي في الحساب البنكي.' : 'Présentation du bilan financier, justification des dépenses et solde en caisse.',
            majorite_requise: isAr ? 'الأغلبية النسبية (المادة 24 من القانون 18-00)' : 'Majorité simple (Art. 24 Loi 18-00)',
            votes: {
              pour: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10', 'user-11', 'user-12', 'user-13', 'user-14', 'user-15'],
              contre: ['user-16'],
              abstention: ['user-17']
            }
          },
          {
            id: 'res-2',
            number: 2,
            title: isAr ? 'إصلاح وعزل مياه الأمطار في السطح العلوي (الكتامة)' : 'Rénovation et imperméabilisation de la terrasse supérieure',
            description: isAr ? 'العرض المختار : شركة أطلس للعزل بمبلغ إجمالي قدره 38 000 درهم.' : 'Devis retenu : Société Atlas Étanchéité pour un montant global de 38 000 DH.',
            majorite_requise: isAr ? 'الأغلبية المطلقة (المادة 25 من القانون 18-00)' : 'Majorité absolue (Art. 25 Loi 18-00)',
            votes: {
              pour: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10', 'user-11'],
              contre: ['user-12', 'user-13', 'user-14'],
              abstention: ['user-15', 'user-16']
            }
          },
          {
            id: 'res-3',
            number: 3,
            title: isAr ? 'تثبيت نظام كاميرات مراقبة (8 كاميرات عالية الدقة)' : 'Installation d’un système de vidéosurveillance 8 caméras HD',
            description: isAr ? 'تثبيت الكاميرات في المدخل، المصاعد ومدخل المرآب السفلي.' : 'Installation de caméras au niveau du hall, ascenseurs et accès parking souterrain.',
            majorite_requise: isAr ? 'أغلبية ثلاثة أرباع الأصوات (المادة 26 من القانون 18-00)' : 'Majorité des 3/4 (Art. 26 Loi 18-00)',
            votes: {
              pour: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9'],
              contre: ['user-10', 'user-11'],
              abstention: []
            }
          }
        ]
      }
    ]
    setAssemblees(initialAg)
    setSelectedAg(initialAg[0])
    localStorage.setItem(storageKey, JSON.stringify(initialAg))
  }, [profile])

  function saveAssemblees(updated) {
    setAssemblees(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    if (selectedAg) {
      const match = updated.find(a => a.id === selectedAg.id)
      if (match) setSelectedAg(match)
    }
  }

  function handleVote(resId, choice) {
    if (!selectedAg || selectedAg.status === 'closed') return

    const userId = profile.id || user?.id || 'current_user'

    const updatedResolutions = selectedAg.resolutions.map(res => {
      if (res.id !== resId) return res

      const pour = (res.votes.pour || []).filter(u => u !== userId)
      const contre = (res.votes.contre || []).filter(u => u !== userId)
      const abstention = (res.votes.abstention || []).filter(u => u !== userId)

      if (choice === 'pour') pour.push(userId)
      if (choice === 'contre') contre.push(userId)
      if (choice === 'abstention') abstention.push(userId)

      return {
        ...res,
        votes: { pour, contre, abstention }
      }
    })

    const updatedAg = { ...selectedAg, resolutions: updatedResolutions }
    const updatedList = assemblees.map(a => a.id === updatedAg.id ? updatedAg : a)
    saveAssemblees(updatedList)
  }

  function handleCreateAg(e) {
    e.preventDefault()
    const newId = `ag-${Date.now()}`
    const created = {
      id: newId,
      title: newAg.title,
      type: newAg.type,
      date: newAg.date,
      time: newAg.time,
      location: newAg.location,
      status: 'open',
      president: profile.full_name || 'Mohammed Benjelloun',
      secretaire: isAr ? 'مقرر الجلسة' : 'Secrétaire de séance',
      total_coproprietaires: 24,
      resolutions: newAg.resolutions.map((rTitle, idx) => ({
        id: `res-${newId}-${idx + 1}`,
        number: idx + 1,
        title: rTitle,
        description: '',
        majorite_requise: isAr ? 'الأغلبية النسبية (المادة 24 من القانون 18-00)' : 'Majorité simple (Art. 24 Loi 18-00)',
        votes: { pour: [], contre: [], abstention: [] }
      }))
    }

    const updatedList = [created, ...assemblees]
    saveAssemblees(updatedList)
    setSelectedAg(created)
    setShowNewAgModal(false)
  }

  function toggleAgStatus(agId) {
    const updated = assemblees.map(a => {
      if (a.id !== agId) return a
      return { ...a, status: a.status === 'open' ? 'closed' : 'open' }
    })
    saveAssemblees(updated)
  }

  const userId = profile.id || user?.id || 'current_user'

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner */}
      <div className="card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        padding: '16px 20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
              {isAr ? '🗳️ الجمع العام والتصويت الإلكتروني' : '🗳️ Assemblées Générales & Votes en Ligne'}
            </h2>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
              {isAr ? 'القانون 18-00 المغربي' : 'Loi 18-00 Maroc'}
            </span>
          </div>
          <p className="muted small" style={{ margin: '2px 0 0 0' }}>
            {isAr
              ? 'تنظيم الجمع العام، التصويت الإلكتروني على القرارات، وتوليد المحضر الرسمي (PV d\'AG) وفق القانون المغربي.'
              : 'Organisation des AG, vote électronique des résolutions et génération du Procès-Verbal officiel (PV d’AG).'}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn-primary"
            style={{
              background: '#0284c7',
              borderColor: '#0284c7',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700
            }}
            onClick={() => setShowNewAgModal(true)}
          >
            {isAr ? '➕ برمجة جمع عام جديد' : '➕ Programmer une nouvelle AG'}
          </button>
        )}
      </div>

      {/* Main Content */}
      {assemblees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p className="muted">{isAr ? 'لم تتم برمجة أي جمع عام بعد.' : 'Aucune Assemblée Générale n’est encore programmée.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAg ? '280px 1fr' : '1fr', gap: '16px' }}>
          {/* Left Column: AG List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="small muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isAr ? `جلسات الجمع العام (${assemblees.length})` : `Sessions d'AG (${assemblees.length})`}
            </span>
            {assemblees.map(ag => {
              const isSelected = selectedAg?.id === ag.id
              const isOpen = ag.status === 'open'
              return (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAg(ag)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: isSelected ? '#f0f9ff' : '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isOpen ? '#dcfce7' : '#f1f5f9',
                      color: isOpen ? '#15803d' : '#64748b'
                    }}>
                      {isOpen ? (isAr ? '🟢 التصويت مفتوح' : '🟢 Vote en cours') : (isAr ? '🔒 مغلقة' : '🔒 Clôturée')}
                    </span>
                    <span className="muted small" style={{ fontSize: '0.75rem' }}>
                      {ag.type === 'Ordinaire' ? (isAr ? 'عادي' : 'Ordinaire') : (isAr ? 'استثنائي' : 'Extraordinaire')}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', lineHeight: 1.3 }}>
                    {ag.title}
                  </strong>
                  <div className="muted small" style={{ marginTop: '6px', fontSize: '0.78rem' }}>
                    📅 {new Date(ag.date).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')} {isAr ? 'على الساعة' : 'à'} {ag.time}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Selected AG Details & Resolutions */}
          {selectedAg && (
            <div className="card" style={{ padding: '20px', borderRadius: '12px' }}>
              {/* AG Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: selectedAg.status === 'open' ? '#dcfce7' : '#fee2e2',
                      color: selectedAg.status === 'open' ? '#166534' : '#991b1b'
                    }}>
                      {selectedAg.status === 'open'
                        ? (isAr ? '🟢 التصويت الإلكتروني مفتوح' : '🟢 Vote électronique ouvert')
                        : (isAr ? '🔒 الجلسة مغلقة' : '🔒 Session clôturée')}
                    </span>
                    <span className="muted small">
                      {isAr ? 'جمع عام' : 'AG'} {selectedAg.type === 'Ordinaire' ? (isAr ? 'عادي' : 'Ordinaire') : (isAr ? 'استثنائي' : 'Extraordinaire')}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{selectedAg.title}</h3>
                  <div className="muted small" style={{ marginTop: '4px' }}>
                    📍 {selectedAg.location} · 📅 {new Date(selectedAg.date).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')} {isAr ? 'على الساعة' : 'à'} {selectedAg.time}
                  </div>
                </div>

                {/* Actions: PV & Toggle Status */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary small"
                    onClick={() => setShowPvModal(selectedAg)}
                    style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isAr ? '📄 طباعة محضر الجمع العام (PV)' : '📄 Imprimer le PV d’AG (Officiel)'}
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      className="btn-secondary small"
                      onClick={() => toggleAgStatus(selectedAg.id)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {selectedAg.status === 'open'
                        ? (isAr ? '🔒 إغلاق التصويت' : '🔒 Clôturer le scrutin')
                        : (isAr ? '🔓 إعادة فتح التصويت' : '🔓 Rouvrir le vote')}
                    </button>
                  )}
                </div>
              </div>

              {/* Resolutions List */}
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
                  {isAr ? `📋 جدول الأعمال والقرارات المعروضة للتصويت (${selectedAg.resolutions.length})` : `📋 Ordre du jour & Résolutions soumises au vote (${selectedAg.resolutions.length})`}
                </h4>

                {selectedAg.resolutions.map(res => {
                  const pourCount = (res.votes.pour || []).length
                  const contreCount = (res.votes.contre || []).length
                  const absCount = (res.votes.abstention || []).length
                  const totalVotes = pourCount + contreCount + absCount
                  const hasVotedPour = (res.votes.pour || []).includes(userId)
                  const hasVotedContre = (res.votes.contre || []).includes(userId)
                  const hasVotedAbs = (res.votes.abstention || []).includes(userId)

                  const pourPct = totalVotes > 0 ? Math.round((pourCount / totalVotes) * 100) : 0
                  const contrePct = totalVotes > 0 ? Math.round((contreCount / totalVotes) * 100) : 0
                  const absPct = totalVotes > 0 ? Math.round((absCount / totalVotes) * 100) : 0

                  const isAdopted = pourCount > contreCount

                  return (
                    <div
                      key={res.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.84rem' }}>
                            {isAr ? `القرار رقم ${res.number}` : `RÉSOLUTION N° ${res.number}`}
                          </span>
                          <h4 style={{ margin: '2px 0 4px 0', fontSize: '1.02rem', color: '#0f172a' }}>
                            {res.title}
                          </h4>
                          {res.description && (
                            <p style={{ margin: '0 0 6px 0', fontSize: '0.86rem', color: '#475569' }}>
                              {res.description}
                            </p>
                          )}
                          <span className="muted small" style={{ fontSize: '0.74rem' }}>
                            ⚖️ {isAr ? 'النصاب المطلوب :' : 'Règle :'} {res.majorite_requise}
                          </span>
                        </div>

                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: isAdopted ? '#dcfce7' : '#fee2e2',
                          color: isAdopted ? '#15803d' : '#b91c1c'
                        }}>
                          {totalVotes === 0
                            ? (isAr ? 'في انتظار الأصوات' : 'En attente de votes')
                            : isAdopted
                            ? (isAr ? '✅ الاتجاه : موافق عليه' : '✅ Tendance : Adoptée')
                            : (isAr ? '❌ الاتجاه : مرفوض' : '❌ Tendance : Rejetée')}
                        </span>
                      </div>

                      {/* Vote Progress Bars */}
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span><strong>🟢 {isAr ? 'موافق' : 'POUR'} :</strong> {pourCount} {isAr ? 'صوت' : 'vote(s)'} ({pourPct}%)</span>
                          <span><strong>🔴 {isAr ? 'معارض' : 'CONTRE'} :</strong> {contreCount} {isAr ? 'صوت' : 'vote(s)'} ({contrePct}%)</span>
                          <span><strong>⚪ {isAr ? 'امتناع' : 'ABSTENTION'} :</strong> {absCount} ({absPct}%)</span>
                        </div>

                        {/* Visual Bar */}
                        <div style={{
                          height: '10px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          display: 'flex',
                          background: '#e2e8f0'
                        }}>
                          <div style={{ width: `${pourPct}%`, background: '#22c55e', transition: 'width 0.3s ease' }} />
                          <div style={{ width: `${contrePct}%`, background: '#ef4444', transition: 'width 0.3s ease' }} />
                          <div style={{ width: `${absPct}%`, background: '#94a3b8', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>

                      {/* Resident Vote Buttons */}
                      <div style={{
                        marginTop: '14px',
                        paddingTop: '10px',
                        borderTop: '1px dashed #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span className="small" style={{ fontWeight: 600, color: '#334155' }}>
                          {isAr ? 'صوتك على هذا القرار :' : 'Votre vote pour cette résolution :'}
                        </span>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={selectedAg.status === 'closed'}
                            onClick={() => handleVote(res.id, 'pour')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: selectedAg.status === 'closed' ? 'not-allowed' : 'pointer',
                              border: hasVotedPour ? '2px solid #16a34a' : '1px solid #cbd5e1',
                              background: hasVotedPour ? '#dcfce7' : '#ffffff',
                              color: hasVotedPour ? '#166534' : '#334155'
                            }}
                          >
                            👍 {isAr ? 'موافق' : 'POUR'} {hasVotedPour && '✓'}
                          </button>
                          <button
                            type="button"
                            disabled={selectedAg.status === 'closed'}
                            onClick={() => handleVote(res.id, 'contre')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: selectedAg.status === 'closed' ? 'not-allowed' : 'pointer',
                              border: hasVotedContre ? '2px solid #dc2626' : '1px solid #cbd5e1',
                              background: hasVotedContre ? '#fee2e2' : '#ffffff',
                              color: hasVotedContre ? '#991b1b' : '#334155'
                            }}
                          >
                            👎 {isAr ? 'معارض' : 'CONTRE'} {hasVotedContre && '✓'}
                          </button>
                          <button
                            type="button"
                            disabled={selectedAg.status === 'closed'}
                            onClick={() => handleVote(res.id, 'abstention')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: selectedAg.status === 'closed' ? 'not-allowed' : 'pointer',
                              border: hasVotedAbs ? '2px solid #64748b' : '1px solid #cbd5e1',
                              background: hasVotedAbs ? '#f1f5f9' : '#ffffff',
                              color: hasVotedAbs ? '#334155' : '#64748b'
                            }}
                          >
                            ✋ {isAr ? 'امتناع' : 'ABSTENTION'} {hasVotedAbs && '✓'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: New AG Form */}
      {showNewAgModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="card" style={{
            background: '#ffffff',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '14px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#0284c7' }}>
                {isAr ? '🗳️ الدعوة لعقد جمع عام' : '🗳️ Convoquer une Assemblée Générale'}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAgModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAg} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'عنوان الجمع العام *' : 'Titre de la session *'}
                </label>
                <input
                  type="text"
                  required
                  value={newAg.title}
                  onChange={e => setNewAg({ ...newAg, title: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="small" style={{ fontWeight: 700 }}>{isAr ? 'النوع' : 'Type'}</label>
                  <select
                    value={newAg.type}
                    onChange={e => setNewAg({ ...newAg, type: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="Ordinaire">{isAr ? 'عادي' : 'Ordinaire'}</option>
                    <option value="Extraordinaire">{isAr ? 'استثنائي' : 'Extraordinaire'}</option>
                  </select>
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 700 }}>{isAr ? 'التاريخ' : 'Date'}</label>
                  <input
                    type="date"
                    required
                    value={newAg.date}
                    onChange={e => setNewAg({ ...newAg, date: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 700 }}>{isAr ? 'التوقيت' : 'Heure'}</label>
                  <input
                    type="time"
                    required
                    value={newAg.time}
                    onChange={e => setNewAg({ ...newAg, time: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700 }}>{isAr ? 'مكان الاجتماع' : 'Lieu de la réunion'}</label>
                <input
                  type="text"
                  value={newAg.location}
                  onChange={e => setNewAg({ ...newAg, location: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              {/* Resolutions Editor */}
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'جدول الأعمال (القرارات المقترحة للتصويت)' : 'Ordre du jour (Résolutions à voter)'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  {newAg.resolutions.map((resText, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0284c7' }}>{idx + 1}.</span>
                      <span style={{ flex: 1, fontSize: '0.84rem' }}>{resText}</span>
                      <button
                        type="button"
                        onClick={() => setNewAg({ ...newAg, resolutions: newAg.resolutions.filter((_, i) => i !== idx) })}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder={isAr ? 'إضافة نقطة لجدول الأعمال...' : 'Ajouter une résolution (ex: Changement société nettoyage)...'}
                    value={newResolutionText}
                    onChange={e => setNewResolutionText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (!newResolutionText.trim()) return
                      setNewAg({ ...newAg, resolutions: [...newAg.resolutions, newResolutionText.trim()] })
                      setNewResolutionText('')
                    }}
                  >
                    {isAr ? 'إضافة' : 'Ajouter'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewAgModal(false)}>
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  {isAr ? '🚀 نشر الجمع العام وفتح التصويت' : '🚀 Publier l\'AG & Ouvrir les votes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official PV d'AG (Loi 18-00) */}
      {showPvModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '16px'
        }}>
          <div className="card" style={{
            background: '#ffffff',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
          }}>
            {/* PV Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.78rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
                {isAr ? 'المملكة المغربية — القانون 18-00 المتعلق بنظام الملكية المشتركة' : 'Royaume du Maroc — Loi 18-00 relative au statut de la copropriété'}
              </span>
              <h2 style={{ margin: '8px 0 4px 0', fontSize: '1.3rem', color: '#0f172a' }}>
                {isAr ? `محضر الجمع العام ${showPvModal.type === 'Ordinaire' ? 'العادي' : 'الاستثنائي'}` : `PROCÈS-VERBAL DE L’ASSEMBLÉE GÉNÉRALE ${showPvModal.type.toUpperCase()}`}
              </h2>
              <strong style={{ color: '#047857' }}>{profile.residences?.name || 'Résidence Al Andalous'}</strong>
            </div>

            {/* PV Details */}
            <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#334155' }}>
              <p>
                {isAr
                  ? `في سنة ${new Date(showPvModal.date).getFullYear()}، بتاريخ ${new Date(showPvModal.date).toLocaleDateString('ar-MA')} على الساعة ${showPvModal.time}، اجتمع الملاك المشتركون في جمع عام بـ : ${showPvModal.location}.`
                  : `L'an ${new Date(showPvModal.date).getFullYear()}, le ${new Date(showPvModal.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${showPvModal.time}, les copropriétaires de l'immeuble se sont réunis en Assemblée Générale à : ${showPvModal.location}.`}
              </p>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', margin: '14px 0', border: '1px solid #e2e8f0' }}>
                <strong>{isAr ? 'تشكيلة مكتب الجلسة :' : 'Bureau de séance constitué :'}</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                  <li><strong>{isAr ? 'رئيس الجلسة :' : 'Président de séance :'}</strong> {showPvModal.president}</li>
                  <li><strong>{isAr ? 'مقرر الجلسة :' : 'Secrétaire de séance :'}</strong> {showPvModal.secretaire}</li>
                  <li><strong>{isAr ? 'فارز الأصوات :' : 'Scrutateur :'}</strong> {isAr ? 'ممثل الملاك المشتركين' : 'Représentant désigné des copropriétaires'}</li>
                </ul>
              </div>

              <h4 style={{ margin: '18px 0 8px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                {isAr ? 'المداولات ونتائج التصويت على القرارات :' : 'DÉLIBÉRATIONS ET RÉSULTATS DES VOTES :'}
              </h4>

              {showPvModal.resolutions.map(res => {
                const p = (res.votes.pour || []).length
                const c = (res.votes.contre || []).length
                const a = (res.votes.abstention || []).length
                const isAdopted = p > c
                return (
                  <div key={res.id} style={{ margin: '12px 0', padding: '10px 14px', background: '#f1f5f9', borderRadius: '8px' }}>
                    <strong>{isAr ? `القرار رقم ${res.number} :` : `Résolution n° ${res.number} :`} {res.title}</strong>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.82rem' }}>
                      <span>{isAr ? 'موافق :' : 'Pour :'} <strong>{p}</strong></span>
                      <span>{isAr ? 'معارض :' : 'Contre :'} <strong>{c}</strong></span>
                      <span>{isAr ? 'امتناع :' : 'Abstentions :'} <strong>{a}</strong></span>
                    </div>
                    <div style={{ marginTop: '4px', fontWeight: 800, color: isAdopted ? '#15803d' : '#b91c1c' }}>
                      {isAr ? 'النتيجة :' : 'Décision :'} {isAdopted ? (isAr ? 'تمت المصادقة على القرار' : 'RÉSOLUTION ADOPTÉE') : (isAr ? 'تم رفض القرار' : 'RÉSOLUTION REJETÉE')}
                    </div>
                  </div>
                )
              })}

              {/* Signatures */}
              <div style={{
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px dashed #94a3b8',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                textAlign: 'center'
              }}>
                <div>
                  <span className="small muted">{isAr ? 'رئيس الجلسة' : 'Le Président de séance'}</span>
                  <div style={{ height: '50px' }}></div>
                  <strong>{showPvModal.president}</strong>
                </div>
                <div>
                  <span className="small muted">{isAr ? 'فارز الأصوات' : 'Le Scrutateur'}</span>
                  <div style={{ height: '50px' }}></div>
                  <strong>{isAr ? '(التوقيع)' : '(Signature)'}</strong>
                </div>
                <div>
                  <span className="small muted">{isAr ? 'المقرر' : 'Le Secrétaire'}</span>
                  <div style={{ height: '50px' }}></div>
                  <strong>{showPvModal.secretaire}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowPvModal(null)}>
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
                style={{ background: '#047857', borderColor: '#047857' }}
              >
                {isAr ? '🖨️ طباعة محضر الجمع العام' : '🖨️ Imprimer le PV d’AG'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
