import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ReclamationsPanel({ canManage }) {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const CATEGORIES = [
    { id: 'ascenseur', label: isAr ? '🛗 المصاعد' : '🛗 Ascenseur', color: '#e0f2fe' },
    { id: 'plomberie', label: isAr ? '💧 السباكة وتسرب المياه' : '💧 Plomberie & Fuite d’eau', color: '#e0f7fa' },
    { id: 'electricite', label: isAr ? '⚡ الكهرباء والإنارة' : '⚡ Électricité & Éclairage', color: '#fef9c3' },
    { id: 'securite', label: isAr ? '🚪 باب الكراج والأمن' : '🚪 Porte garage & Sécurité', color: '#fee2e2' },
    { id: 'nettoyage', label: isAr ? '🧹 النظافة والصيانة' : '🧹 Nettoyage & Hygiène', color: '#f0fdf4' },
    { id: 'voisinage', label: isAr ? '🔊 الإزعاج وحسن الجوار' : '🔊 Nuisances & Voisinage', color: '#ede9fe' },
    { id: 'autre', label: isAr ? '🔧 عطل آخر' : '🔧 Autre signalement', color: '#f1f5f9' }
  ]

  const [reclamations, setReclamations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'open', 'resolved'
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // Form state
  const [form, setForm] = useState({
    title: '',
    category: 'ascenseur',
    location: '',
    urgency: 'normal',
    description: '',
    photo: null
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Resolution modal for syndic
  const [resolvingId, setResolvingId] = useState(null)
  const [resolveForm, setResolveForm] = useState({
    status: 'resolu',
    prestataire: '',
    resolution_note: ''
  })

  function loadReclamations() {
    setLoading(true)
    const storageKey = `syndic_reclamations_${profile.residence_id || 'default'}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setReclamations(JSON.parse(saved))
      } catch (e) {
        setReclamations([])
      }
    } else {
      const initial = [
        {
          id: 'rec-1',
          title: isAr ? 'عطل متكرر في مصعد العمارة B' : 'Panne intermittente ascenseur Cage B',
          category: 'ascenseur',
          location: isAr ? 'العمارة B، بين الطابق 2 و 3' : 'Immeuble B, entre le 2ème et 3ème étage',
          urgency: 'urgent',
          description: isAr ? 'المصعد يتوقف فجأة والأبواب تتأخر في الفتح.' : 'L’ascenseur s’arrête brusquement et les portes refusent de s’ouvrir immédiatement. Risque de blocage.',
          status: 'en_cours',
          prestataire: isAr ? 'شركة شندلر للمصاعد' : 'Société Schindler Maroc',
          created_by_name: 'Karim El Amrani',
          created_by_apt: 'B-14',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          photo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
          resolution_note: isAr ? 'التقني مبرمج للتدخل هذا الخميس صباحاً.' : 'Technicien programmé pour intervention ce jeudi à 10h.'
        },
        {
          id: 'rec-2',
          title: isAr ? 'احتراق مصابيح الإنارة في ممر الحديقة' : 'Ampoules grillées dans l’éclairage de l’allée piétonne',
          category: 'electricite',
          location: isAr ? 'الحديقة والمدخل الرئيسي' : 'Jardin & Entrée principale',
          urgency: 'normal',
          description: isAr ? '3 أضواء كاشفة معطلة بعد التساقطات الأخيرة.' : '3 spots LED extérieurs ne s’allument plus depuis les pluies de mardi.',
          status: 'resolu',
          prestataire: isAr ? 'كهربائي الإقامة' : 'Électricien Al Andalous',
          created_by_name: 'Mohammed Benjelloun',
          created_by_apt: isAr ? 'السنديك' : 'Syndic',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          photo: null,
          resolution_note: isAr ? 'تم استبدال المحولات المعطلة بالكامل.' : 'Remplacement des 3 transformateurs étanches effectué le 28/09.',
          resolved_at: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ]
      setReclamations(initial)
      localStorage.setItem(storageKey, JSON.stringify(initial))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadReclamations()
  }, [profile])

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result)
      setForm(prev => ({ ...prev, photo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  function handleCreateReclamation(e) {
    e.preventDefault()
    if (!form.title) return
    setSubmitting(true)

    const newTicket = {
      id: `rec-${Date.now()}`,
      title: form.title,
      category: form.category,
      location: form.location || (isAr ? 'الأجزاء المشتركة' : 'Parties communes'),
      urgency: form.urgency,
      description: form.description,
      status: 'signale',
      prestataire: '',
      created_by_name: profile.full_name || (isAr ? 'ساكن' : 'Résident'),
      created_by_apt: profile.apartment_number ? `${isAr ? 'شقة' : 'Apt'} ${profile.apartment_number}` : (isAr ? 'السنديك' : 'Syndic'),
      created_at: new Date().toISOString(),
      photo: form.photo,
      resolution_note: ''
    }

    const storageKey = `syndic_reclamations_${profile.residence_id || 'default'}`
    const updated = [newTicket, ...reclamations]
    setReclamations(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))

    setForm({
      title: '',
      category: 'ascenseur',
      location: '',
      urgency: 'normal',
      description: '',
      photo: null
    })
    setPreviewUrl(null)
    setShowNewModal(false)
    setSubmitting(false)
  }

  function handleSaveResolution(id) {
    const storageKey = `syndic_reclamations_${profile.residence_id || 'default'}`
    const updated = reclamations.map(r => {
      if (r.id !== id) return r
      return {
        ...r,
        status: resolveForm.status,
        prestataire: resolveForm.prestataire || r.prestataire,
        resolution_note: resolveForm.resolution_note || r.resolution_note,
        resolved_at: resolveForm.status === 'resolu' ? new Date().toISOString() : r.resolved_at
      }
    })
    setReclamations(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setResolvingId(null)
  }

  const filtered = reclamations.filter(r => {
    if (filterStatus === 'open') return r.status !== 'resolu'
    if (filterStatus === 'resolved') return r.status === 'resolu'
    return true
  })

  const openCount = reclamations.filter(r => r.status !== 'resolu').length
  const urgentCount = reclamations.filter(r => r.status !== 'resolu' && (r.urgency === 'urgent' || r.urgency === 'critique')).length

  if (loading) return <p className="muted">{isAr ? 'جارٍ تحميل الشكايات...' : 'Chargement des signalements...'}</p>

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner with Direct Action */}
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
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
            {isAr ? '🚨 التبليغ عن الأعطال والشكايات' : '🚨 Signalement des Pannes & Réclamations'}
          </h2>
          <p className="muted small" style={{ margin: '2px 0 0 0' }}>
            {isAr ? 'متابعة أعطال الأسانسور، تسربات المياه، الكهرباء وتدخلات شركات الصيانة' : 'Suivi en temps réel des pannes d’ascenseur, fuites, électricité et interventions prestataires'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#e11d48',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(225,29,72,0.2)'
          }}
          onClick={() => setShowNewModal(true)}
        >
          {isAr ? '➕ التبليغ عن عطل أو مشكل' : '➕ Signaler une panne / incident'}
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        <div className="card" style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px' }}>
            {isAr ? 'إجمالي الشكايات' : 'Total des réclamations'}
          </span>
          <strong style={{ fontSize: '1.3rem', color: '#1e293b' }}>{reclamations.length}</strong>
        </div>
        <div className="card" style={{ padding: '14px', background: openCount > 0 ? '#fff1f2' : '#f0fdf4', border: `1px solid ${openCount > 0 ? '#fecdd3' : '#bbf7d0'}`, borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px', color: openCount > 0 ? '#be123c' : '#15803d' }}>
            {isAr ? 'أعطال قيد المعالجة' : 'Pannes en cours'}
          </span>
          <strong style={{ fontSize: '1.3rem', color: openCount > 0 ? '#e11d48' : '#15803d' }}>
            {openCount > 0 ? (isAr ? `⚠️ ${openCount} في الانتظار` : `⚠️ ${openCount} en attente`) : (isAr ? '✅ لا توجد أعطال' : '✅ Aucune panne')}
          </strong>
        </div>
        <div className="card" style={{ padding: '14px', background: urgentCount > 0 ? '#fef2f2' : '#f8fafc', border: `1px solid ${urgentCount > 0 ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px' }}>
          <span className="muted small" style={{ display: 'block', marginBottom: '4px', color: urgentCount > 0 ? '#b91c1c' : '#64748b' }}>
            {isAr ? 'حالات مستعجلة' : 'Urgences critiques'}
          </span>
          <strong style={{ fontSize: '1.3rem', color: urgentCount > 0 ? '#b91c1c' : '#1e293b' }}>
            {urgentCount > 0 ? (isAr ? `🔥 ${urgentCount} حالة مستعجلة` : `🔥 ${urgentCount} urgente(s)`) : '0'}
          </strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className={'tab' + (filterStatus === 'all' ? ' active' : '')}
          style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.84rem' }}
          onClick={() => setFilterStatus('all')}
        >
          {isAr ? `الكل (${reclamations.length})` : `Toutes (${reclamations.length})`}
        </button>
        <button
          type="button"
          className={'tab' + (filterStatus === 'open' ? ' active' : '')}
          style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.84rem' }}
          onClick={() => setFilterStatus('open')}
        >
          {isAr ? `قيد المعالجة (${openCount})` : `En cours / Ouvertes (${openCount})`}
        </button>
        <button
          type="button"
          className={'tab' + (filterStatus === 'resolved' ? ' active' : '')}
          style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.84rem' }}
          onClick={() => setFilterStatus('resolved')}
        >
          {isAr ? `تم الإصلاح (${reclamations.length - openCount})` : `Résolues (${reclamations.length - openCount})`}
        </button>
      </div>

      {/* Reclamations List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p className="muted" style={{ margin: 0 }}>
            {isAr ? 'لا توجد شكايات أو أعطال في هذا القسم.' : 'Aucun signalement dans cette catégorie.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(rec => {
            const catObj = CATEGORIES.find(c => c.id === rec.category) || CATEGORIES[6]
            const isResolved = rec.status === 'resolu'
            const isInProgress = rec.status === 'en_cours'

            return (
              <div
                key={rec.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${isResolved ? '#10b981' : isInProgress ? '#f59e0b' : '#ef4444'}`,
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{
                        background: catObj.color,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0f172a'
                      }}>
                        {catObj.label}
                      </span>
                      {rec.urgency === 'urgent' && (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {isAr ? '⚠️ مستعجل' : '⚠️ Urgent'}
                        </span>
                      )}
                      {rec.urgency === 'critique' && (
                        <span style={{ background: '#f43f5e', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {isAr ? '🔥 حرج / خطر' : '🔥 Critique'}
                        </span>
                      )}
                      <span className="muted small">
                        📍 {rec.location} · {new Date(rec.created_at).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')} {isAr ? 'بواسطة' : 'par'} <strong>{rec.created_by_name} ({rec.created_by_apt})</strong>
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', color: '#0f172a' }}>
                      {rec.title}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: isResolved ? '#ecfdf5' : isInProgress ? '#fef3c7' : '#fee2e2',
                    color: isResolved ? '#047857' : isInProgress ? '#b45309' : '#b91c1c',
                    border: `1px solid ${isResolved ? '#86efac' : isInProgress ? '#fde68a' : '#fca5a5'}`
                  }}>
                    {isResolved
                      ? (isAr ? '✅ تم الإصلاح والإغلاق' : '✅ Résolu & Clôturé')
                      : isInProgress
                      ? (isAr ? '⚙️ قيد التدخل والصيانة' : '⚙️ En cours de traitement')
                      : (isAr ? '🔴 مسجل / قيد الانتظار' : '🔴 Signalé / En attente')}
                  </span>
                </div>

                <p style={{ margin: '8px 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  {rec.description}
                </p>

                {/* Photo thumbnail */}
                {rec.photo && (
                  <div style={{ margin: '8px 0' }}>
                    <img
                      src={rec.photo}
                      alt="Photo incident"
                      style={{
                        width: '120px',
                        height: '90px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedPhoto(rec.photo)}
                      title={isAr ? 'انقر لتكبير الصورة' : 'Cliquez pour agrandir'}
                    />
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                      📷 {isAr ? 'انقر لعرض الصورة بحجم كامل' : 'Cliquez pour voir la photo'}
                    </span>
                  </div>
                )}

                {/* Assigned provider or resolution details */}
                {(rec.prestataire || rec.resolution_note) && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isResolved ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${isResolved ? '#bbf7d0' : '#e2e8f0'}`,
                    fontSize: '0.84rem'
                  }}>
                    {rec.prestataire && (
                      <div style={{ marginBottom: '4px' }}>
                        <strong>{isAr ? '🛠️ الشركة أو التقني المكلف :' : '🛠️ Prestataire assigné :'}</strong> {rec.prestataire}
                      </div>
                    )}
                    {rec.resolution_note && (
                      <div style={{ color: isResolved ? '#15803d' : '#475569' }}>
                        <strong>{isAr ? '📝 تقرير وتفاصيل التدخل :' : '📝 Suivi / Solution :'}</strong> {rec.resolution_note}
                      </div>
                    )}
                  </div>
                )}

                {/* Action for Syndic to update */}
                {canManage && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary small"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={() => {
                        setResolvingId(rec.id)
                        setResolveForm({
                          status: rec.status,
                          prestataire: rec.prestataire || '',
                          resolution_note: rec.resolution_note || ''
                        })
                      }}
                    >
                      {isAr ? '✏️ تحديث التدخل والصيانة' : '✏️ Mettre à jour l’intervention'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Signaler un nouveau problème */}
      {showNewModal && (
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
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '12px',
            padding: '22px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#e11d48' }}>
                {isAr ? '🚨 التبليغ عن عطل أو حادث بالإقامة' : '🚨 Signaler une panne ou un incident'}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReclamation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'عنوان المشكل أو العطل *' : 'Titre du signalement *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: توقف المصعد في الطابق الثاني' : 'Ex: Ascenseur bloqué au 2ème étage'}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="small" style={{ fontWeight: 700 }}>
                    {isAr ? 'الصنف' : 'Catégorie'}
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="small" style={{ fontWeight: 700 }}>
                    {isAr ? 'درجة الخطورة' : 'Degré d\'urgence'}
                  </label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="normal">{isAr ? '🟢 عادي' : '🟢 Normal'}</option>
                    <option value="urgent">{isAr ? '🟠 مستعجل (يؤثر على الإقامة)' : '🟠 Urgent (Impacte l\'immeuble)'}</option>
                    <option value="critique">{isAr ? '🔴 حرج (خطر أو توقف تام)' : '🔴 Critique (Danger / Blocage)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'المكان بالضبط' : 'Emplacement précis'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: العمارة B، الطابق الثاني، المرآب رقم 14...' : 'Ex: Cage B, 2ème étage, Parking sous-sol place 14...'}
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'وصف المشكل بالتفصيل *' : 'Description de la panne / incident *'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={isAr ? 'اشرح ما لاحظته، أصوات غريبة، أو تسربات...' : 'Décrivez les symptômes, bruits anormaux, risques...'}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  {isAr ? '📷 صورة العطل (من هاتفك أو حاسوبك)' : '📷 Photo du problème (depuis votre téléphone / PC)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  style={{ fontSize: '0.85rem' }}
                />
                {previewUrl && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={previewUrl}
                      alt="Aperçu"
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewModal(false)}>
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ background: '#e11d48', borderColor: '#e11d48' }}
                >
                  {submitting ? (isAr ? 'جارٍ الإرسال...' : 'Envoi...') : (isAr ? '🚀 إرسال البلاغ' : '🚀 Envoyer le signalement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mise à jour syndic */}
      {resolvingId && (
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
          <div className="card" style={{ background: '#ffffff', maxWidth: '480px', width: '100%', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#0f172a' }}>
              {isAr ? '🛠️ متابعة وإصلاح العطل' : '🛠️ Suivi & Résolution de l’intervention'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'حالة التدخل' : 'Statut de l\'intervention'}
                </label>
                <select
                  value={resolveForm.status}
                  onChange={e => setResolveForm({ ...resolveForm, status: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="signale">{isAr ? '🔴 مسجل / قيد الانتظار' : '🔴 Signalé / En attente'}</option>
                  <option value="en_cours">{isAr ? '⚙️ قيد التدخل (تم الاتصال بالتقني)' : '⚙️ En cours de traitement (Prestataire contacté)'}</option>
                  <option value="resolu">{isAr ? '✅ تم الإصلاح بالكامل' : '✅ Résolu & Réparé'}</option>
                </select>
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'الشركة أو التقني المكلف' : 'Prestataire / Société assignée'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: شركة شندلر / كهربائي الإقامة' : 'Ex: Société Schindler / Électricien Al Andalous...'}
                  value={resolveForm.prestataire}
                  onChange={e => setResolveForm({ ...resolveForm, prestataire: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label className="small" style={{ fontWeight: 700 }}>
                  {isAr ? 'تقرير التدخل والحل المتخذ' : 'Note d’intervention / Rapport'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isAr ? 'مثال: حضر التقني وتم تغيير القطعة المعطلة بنجاح.' : 'Ex: Le technicien est passé, remplacement de la pièce effectué avec succès.'}
                  value={resolveForm.resolution_note}
                  onChange={e => setResolveForm({ ...resolveForm, resolution_note: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setResolvingId(null)}>
                  {isAr ? 'إغلاق' : 'Fermer'}
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveResolution(resolvingId)}>
                  {isAr ? 'حفظ التعديلات' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Modal */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '16px'
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={selectedPhoto}
              alt="Photo agrandie"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }}
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
