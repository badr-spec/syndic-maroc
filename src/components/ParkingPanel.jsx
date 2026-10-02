import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ParkingPanel({ canManage = true }) {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [activeTab, setActiveTab] = useState('places') // 'places' | 'incidents'
  const [spots, setSpots] = useState([])
  const [incidents, setIncidents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Modals
  const [showAddSpotModal, setShowAddSpotModal] = useState(false)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [editingSpot, setEditingSpot] = useState(null)

  // Form states
  const [spotForm, setSpotForm] = useState({
    spot_number: '',
    level: 'Sous-sol -1',
    resident_name: '',
    apartment_number: '',
    matricule: '',
    vehicle_model: '',
    phone: '',
    badge_number: ''
  })

  const [incidentForm, setIncidentForm] = useState({
    spot_number: '',
    matricule_gênant: '',
    vehicle_desc: '',
    motif: 'Stationnement sur place privée sans autorisation'
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const resSpots = await supabase.from('parking_spots').select('*')
      const resIncidents = await supabase.from('parking_incidents').select('*')
      setSpots(resSpots.data || [])
      setIncidents(resIncidents.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSpot(e) {
    e.preventDefault()
    if (!spotForm.spot_number) return

    if (editingSpot) {
      await supabase.from('parking_spots').update(spotForm).eq('id', editingSpot.id)
    } else {
      await supabase.from('parking_spots').insert({
        ...spotForm,
        residence_id: profile?.residence_id || 'res-andalous-1'
      })
    }

    setShowAddSpotModal(false)
    setEditingSpot(null)
    setSpotForm({
      spot_number: '',
      level: 'Sous-sol -1',
      resident_name: '',
      apartment_number: '',
      matricule: '',
      vehicle_model: '',
      phone: '',
      badge_number: ''
    })
    loadData()
  }

  async function handleDeleteSpot(id) {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المكان؟' : 'Supprimer cette place de parking ?')) return
    await supabase.from('parking_spots').delete().eq('id', id)
    loadData()
  }

  async function handleReportIncident(e) {
    e.preventDefault()
    if (!incidentForm.spot_number || !incidentForm.matricule_gênant) return

    await supabase.from('parking_incidents').insert({
      ...incidentForm,
      residence_id: profile?.residence_id || 'res-andalous-1',
      reported_by: profile?.full_name || 'Résident',
      date: new Date().toISOString().split('T')[0],
      status: 'en_cours',
      action_taken: 'Signalement en cours de traitement par le syndic'
    })

    setShowIncidentModal(false)
    setIncidentForm({
      spot_number: '',
      matricule_gênant: '',
      vehicle_desc: '',
      motif: 'Stationnement sur place privée sans autorisation'
    })
    setActiveTab('incidents')
    loadData()
  }

  async function handleResolveIncident(incident) {
    const action = prompt(
      isAr ? 'ما هو الإجراء الذي تم اتخاذه لحل المشكل؟' : 'Action entreprise pour résoudre ce problème ?',
      isAr ? 'تم الاتصال بالسائق وتم نقل السيارة.' : 'Conducteur contacté et véhicule déplacé.'
    )
    if (!action) return

    await supabase.from('parking_incidents').update({
      status: 'resolu',
      action_taken: action
    }).eq('id', incident.id)
    loadData()
  }

  const filteredSpots = spots.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.spot_number || '').toLowerCase().includes(q) ||
      (s.apartment_number || '').toLowerCase().includes(q) ||
      (s.resident_name || '').toLowerCase().includes(q) ||
      (s.matricule || '').toLowerCase().includes(q) ||
      (s.vehicle_model || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="panel">
      {/* Header & Sub-Tabs */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚗</span>
            {isAr ? 'تدبير المرآب وركن السيارات' : 'Gestion du Parking & Stationnement'}
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.86rem' }}>
            {isAr
              ? 'توزيع الأماكن، أرقام اللوحات المعدنية، والتبليغ عن السيارات الغريبة'
              : 'Attribution des places, plaques d’immatriculation et gestion des conflits'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowIncidentModal(true)}
            style={{
              background: '#fff1f2',
              color: '#e11d48',
              borderColor: '#fecdd3',
              fontWeight: 700,
              fontSize: '0.84rem'
            }}
          >
            <span>🚨</span>
            {isAr ? 'تبليغ عن سيارة مخالفة' : 'Signaler un véhicule gênant'}
          </button>

          {canManage && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingSpot(null)
                setSpotForm({
                  spot_number: '',
                  level: 'Sous-sol -1',
                  resident_name: '',
                  apartment_number: '',
                  matricule: '',
                  vehicle_model: '',
                  phone: '',
                  badge_number: ''
                })
                setShowAddSpotModal(true)
              }}
              style={{ fontWeight: 700, fontSize: '0.84rem' }}
            >
              <span>➕</span>
              {isAr ? 'إضافة مكان ركن' : 'Ajouter une place'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('places')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: activeTab === 'places' ? '1.5px solid #047857' : '1px solid #cbd5e1',
            background: activeTab === 'places' ? '#047857' : '#ffffff',
            color: activeTab === 'places' ? '#ffffff' : '#334155',
            cursor: 'pointer'
          }}
        >
          🚗 {isAr ? `دليل الأماكن والسيارات (${spots.length})` : `Répertoire des Places (${spots.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incidents')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: activeTab === 'incidents' ? '1.5px solid #e11d48' : '1px solid #cbd5e1',
            background: activeTab === 'incidents' ? '#e11d48' : '#ffffff',
            color: activeTab === 'incidents' ? '#ffffff' : '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🚨</span>
          <span>{isAr ? `البلاغات والنزاعات (${incidents.filter(i => i.status === 'en_cours').length})` : `Incidents & Conflits (${incidents.filter(i => i.status === 'en_cours').length})`}</span>
        </button>
      </div>

      {/* TAB 1: PLACES */}
      {activeTab === 'places' && (
        <>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={isAr ? '🔍 بحث برقم المكان، الشقة، الساكن، أو لوحة السيارة (Matricule)...' : '🔍 Rechercher par N° place, appartement, nom ou matricule...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* Spots Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px'
          }}>
            {filteredSpots.map(s => (
              <div
                key={s.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}
              >
                {/* Spot Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      background: '#047857',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '1rem',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      N° {s.spot_number}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {s.level}
                    </span>
                  </div>

                  {s.apartment_number && (
                    <span style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}>
                      Appt {s.apartment_number}
                    </span>
                  )}
                </div>

                {/* Resident info */}
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>
                    {s.resident_name || (isAr ? 'مكان غير مخصص' : 'Emplacement libre')}
                  </strong>
                  {s.vehicle_model && (
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      🚗 {s.vehicle_model}
                    </span>
                  )}
                </div>

                {/* Moroccan Matricule Plate Box */}
                {s.matricule && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #0f172a',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    fontSize: '0.95rem',
                    color: '#0f172a'
                  }}>
                    <span style={{ color: '#047857' }}>🇲🇦</span>
                    <span>{s.matricule}</span>
                  </div>
                )}

                {/* Contact & Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                  paddingTop: '8px',
                  borderTop: '1px solid #f1f5f9',
                  gap: '6px'
                }}>
                  {s.phone ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a
                        href={`https://wa.me/212${s.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                          isAr
                            ? `السلام عليكم، بخصوص مكان ركن السيارة رقم ${s.spot_number} بإقامة الأندلس.`
                            : `Bonjour, concernant la place de parking N° ${s.spot_number} à la Résidence Al Andalous.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        💬 WhatsApp
                      </a>
                      <a
                        href={`tel:${s.phone}`}
                        style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                      >
                        📞
                      </a>
                    </div>
                  ) : (
                    <span className="small muted">{isAr ? 'لا يوجد هاتف' : 'Pas de contact'}</span>
                  )}

                  {canManage && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSpot(s)
                          setSpotForm(s)
                          setShowAddSpotModal(true)
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        title={isAr ? 'تعديل' : 'Modifier'}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpot(s.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        title={isAr ? 'حذف' : 'Supprimer'}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredSpots.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              {isAr ? 'لا توجد أماكن مطابقة للبحث' : 'Aucune place trouvée'}
            </div>
          )}
        </>
      )}

      {/* TAB 2: INCIDENTS / SIGNALEMENTS */}
      {activeTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {incidents.map(inc => {
            const isResolved = inc.status === 'resolu'
            return (
              <div
                key={inc.id}
                style={{
                  background: '#ffffff',
                  border: isResolved ? '1px solid #cbd5e1' : '1.5px solid #fda4af',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{isResolved ? '✅' : '🚨'}</span>
                    <strong>{isAr ? `مكان ركن N° ${inc.spot_number}` : `Place de parking N° ${inc.spot_number}`}</strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: isResolved ? '#dcfce7' : '#fee2e2',
                      color: isResolved ? '#15803d' : '#b91c1c'
                    }}>
                      {isResolved ? (isAr ? 'تم الحل' : 'Résolu') : (isAr ? 'في طور المعالجة' : 'En cours')}
                    </span>
                  </div>

                  <span className="small muted">{inc.date}</span>
                </div>

                <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                  <strong>{isAr ? 'السيارة المخالفة : ' : 'Véhicule en infraction : '}</strong>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1'
                  }}>
                    {inc.matricule_gênant}
                  </span>
                  {inc.vehicle_desc && ` (${inc.vehicle_desc})`}
                </div>

                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  <strong>{isAr ? 'السبب : ' : 'Motif : '}</strong> {inc.motif}
                  {inc.reported_by && ` · ${isAr ? 'المُبلّغ' : 'Signalé par'} : ${inc.reported_by}`}
                </div>

                {inc.action_taken && (
                  <div style={{
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    color: '#047857',
                    borderLeft: '3px solid #047857'
                  }}>
                    <strong>{isAr ? 'الإجراء المتخذ : ' : 'Action menée : '}</strong>
                    {inc.action_taken}
                  </div>
                )}

                {canManage && !isResolved && (
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleResolveIncident(inc)}
                      style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#047857', borderColor: '#047857' }}
                    >
                      {isAr ? '✅ تحديد كـ محلول' : '✅ Marquer comme résolu'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {incidents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
              🎉 {isAr ? 'لا توجد أي مخالفات أو سيارات محجوزة حالياً.' : 'Aucun incident de stationnement signalé.'}
            </div>
          )}
        </div>
      )}

      {/* Modal: Ajouter / Modifier une place */}
      {showAddSpotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>
              {editingSpot
                ? (isAr ? 'تعديل مكان الركن' : 'Modifier la place de parking')
                : (isAr ? 'إضافة مكان ركن جديد' : 'Ajouter une place de parking')}
            </h3>

            <form onSubmit={handleSaveSpot}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'رقم المكان *' : 'N° de la place *'}
                  <input
                    type="text"
                    required
                    placeholder="ex: 14"
                    value={spotForm.spot_number}
                    onChange={e => setSpotForm({ ...spotForm, spot_number: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'الطابق / المستوى' : 'Niveau / Étage'}
                  <select
                    value={spotForm.level}
                    onChange={e => setSpotForm({ ...spotForm, level: e.target.value })}
                  >
                    <option value="Sous-sol -1">Sous-sol -1</option>
                    <option value="Sous-sol -2">Sous-sol -2</option>
                    <option value="Sous-sol -3">Sous-sol -3</option>
                    <option value="Extérieur / Cour">Extérieur / Cour</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'اسم الساكن / المالك' : 'Nom du résident'}
                  <input
                    type="text"
                    placeholder="ex: Karim El Amrani"
                    value={spotForm.resident_name}
                    onChange={e => setSpotForm({ ...spotForm, resident_name: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'رقم الشقة' : 'N° Appartement'}
                  <input
                    type="text"
                    placeholder="ex: B-14"
                    value={spotForm.apartment_number}
                    onChange={e => setSpotForm({ ...spotForm, apartment_number: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'لوحة السيارة (Matricule)' : 'Matricule voiture'}
                  <input
                    type="text"
                    placeholder="ex: 12345-أ-6"
                    value={spotForm.matricule}
                    onChange={e => setSpotForm({ ...spotForm, matricule: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'نوع ولون السيارة' : 'Modèle & couleur'}
                  <input
                    type="text"
                    placeholder="ex: Dacia Duster Gris"
                    value={spotForm.vehicle_model}
                    onChange={e => setSpotForm({ ...spotForm, vehicle_model: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'رقم هاتف السائق' : 'Téléphone contact'}
                  <input
                    type="tel"
                    placeholder="0661000000"
                    value={spotForm.phone}
                    onChange={e => setSpotForm({ ...spotForm, phone: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'رقم شارة الدخول (Badge)' : 'N° Badge / Télécommande'}
                  <input
                    type="text"
                    placeholder="ex: BDG-044"
                    value={spotForm.badge_number}
                    onChange={e => setSpotForm({ ...spotForm, badge_number: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddSpotModal(false)}
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-primary">
                  {isAr ? 'حفظ' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Signaler un véhicule gênant */}
      {showIncidentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '450px', width: '100%', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚨</span>
              {isAr ? 'التبليغ عن سيارة مخالفة أو وقوف عشوائي' : 'Signaler un véhicule gênant'}
            </h3>

            <p className="small muted" style={{ marginBottom: '14px' }}>
              {isAr
                ? 'سيتم إشعار السنديك والحارس فوراً بالمعلومات للتواصل مع السائق وحل المشكل.'
                : 'Le syndic et le concierge recevront l’alerte instantanément pour contacter le propriétaire.'}
            </p>

            <form onSubmit={handleReportIncident}>
              <label>
                {isAr ? 'رقم مكان الركن المتضرر *' : 'N° de la place concernée *'}
                <input
                  type="text"
                  required
                  placeholder="ex: 12"
                  value={incidentForm.spot_number}
                  onChange={e => setIncidentForm({ ...incidentForm, spot_number: e.target.value })}
                />
              </label>

              <label>
                {isAr ? 'لوحة السيارة المخالفة (Matricule) *' : 'Matricule du véhicule gênant *'}
                <input
                  type="text"
                  required
                  placeholder="ex: 74123-أ-26"
                  value={incidentForm.matricule_gênant}
                  onChange={e => setIncidentForm({ ...incidentForm, matricule_gênant: e.target.value })}
                />
              </label>

              <label>
                {isAr ? 'وصف السيارة (الموديل واللون)' : 'Description (marque, couleur)'}
                <input
                  type="text"
                  placeholder="ex: Hyundai Tucson Bleue"
                  value={incidentForm.vehicle_desc}
                  onChange={e => setIncidentForm({ ...incidentForm, vehicle_desc: e.target.value })}
                />
              </label>

              <label>
                {isAr ? 'نوع المخالفة' : 'Type d’infraction'}
                <select
                  value={incidentForm.motif}
                  onChange={e => setIncidentForm({ ...incidentForm, motif: e.target.value })}
                >
                  <option value="Stationnement sur place privée sans autorisation">Stationnement sur place privée sans autorisation</option>
                  <option value="Véhicule bloquant la circulation / sortie de garage">Véhicule bloquant la sortie de garage</option>
                  <option value="Voiture stationnée en double file">Voiture stationnée en double file</option>
                  <option value="Feux allumés / vitre ouverte">Feux allumés ou vitre ouverte</option>
                  <option value="Autre motif">Autre motif</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowIncidentModal(false)}
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: '#e11d48', borderColor: '#e11d48' }}
                >
                  {isAr ? 'إرسال البلاغ' : 'Envoyer le signalement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
