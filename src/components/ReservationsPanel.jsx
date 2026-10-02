import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ReservationsPanel({ canManage = true }) {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [reservations, setReservations] = useState([])
  const [filterFacility, setFilterFacility] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const FACILITIES = [
    {
      id: 'stah',
      name: isAr ? 'السطح المشترك (السطاح)' : 'Terrasse Commune (Stah)',
      icon: '🌇',
      rules: isAr ? 'مخصص للأشغال، الأطباق الفضائية، وأشغال الطاقة الشمسية' : 'Accès pour travaux, antennes, linge et maintenance'
    },
    {
      id: 'salle',
      name: isAr ? 'القاعة متعددة الاستعمالات' : 'Salle polyvalente / Réunions',
      icon: '🏛️',
      rules: isAr ? 'حفلات عائلية، اجتماعات ولقاءات الساكنة' : 'Réunions de copropriétaires et réceptions calmes'
    },
    {
      id: 'jardin',
      name: isAr ? 'حديقة الإقامة وفضاء الأنشطة' : 'Jardin & Espace commun',
      icon: '🌳',
      rules: isAr ? 'أنشطة الأطفال واللقاءات الهادئة' : 'Détente et activités d’enfants'
    }
  ]

  const [form, setForm] = useState({
    facility_id: 'stah',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time_slot: '14:00 - 18:00',
    purpose: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await supabase.from('reservations').select('*').order('date', { ascending: true })
      setReservations(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateReservation(e) {
    e.preventDefault()
    if (!form.purpose || !form.date) return

    const selectedFacility = FACILITIES.find(f => f.id === form.facility_id) || FACILITIES[0]

    const newRes = {
      facility_name: selectedFacility.name,
      facility_icon: selectedFacility.icon,
      resident_name: profile?.full_name || 'Résident',
      apartment_number: profile?.apartment_number || 'N/A',
      phone: profile?.phone || '',
      date: form.date,
      time_slot: form.time_slot,
      purpose: form.purpose,
      notes: form.notes || (isAr ? 'موافقة على شروط النظافة والهدوء' : 'Engagement au respect du calme et de la propreté'),
      status: canManage ? 'approuve' : 'en_attente',
      residence_id: profile?.residence_id || 'res-andalous-1',
      created_at: new Date().toISOString()
    }

    await supabase.from('reservations').insert(newRes)
    setShowAddModal(false)
    setForm({
      facility_id: 'stah',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time_slot: '14:00 - 18:00',
      purpose: '',
      notes: ''
    })
    loadData()
  }

  async function handleUpdateStatus(id, newStatus) {
    await supabase.from('reservations').update({ status: newStatus }).eq('id', id)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm(isAr ? 'هل تريد حذف هذا الحجز؟' : 'Supprimer cette réservation ?')) return
    await supabase.from('reservations').delete().eq('id', id)
    loadData()
  }

  const filtered = reservations.filter(r => {
    if (filterFacility === 'all') return true
    return (r.facility_name || '').toLowerCase().includes(filterFacility)
  })

  return (
    <div className="panel">
      {/* Top Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅🏊‍♂️</span>
            {isAr ? 'حجز المرافق والتجهيزات المشتركة' : 'Réservation des Équipements Communs'}
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.86rem' }}>
            {isAr
              ? 'تنظيم استعمال السطح (السطاح)، القاعة المشتركة، وتفادي تداخل المواعيد بين الجيران'
              : 'Gestion des créneaux pour la terrasse (stah), salle polyvalente et espaces partagés'}
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ fontWeight: 700, fontSize: '0.84rem' }}
        >
          <span>➕</span>
          {isAr ? 'طلب حجز مرفق' : 'Nouvelle réservation'}
        </button>
      </div>

      {/* Facilities Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {FACILITIES.map(fac => (
          <div
            key={fac.id}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '2rem' }}>{fac.icon}</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.94rem', color: '#0f172a' }}>
                {fac.name}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                {fac.rules}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <div className="card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
            📋 {isAr ? `جدول الحجوزات والمواعيد (${filtered.length})` : `Planning des réservations (${filtered.length})`}
          </h3>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFilterFacility('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: filterFacility === 'all' ? '1.5px solid #047857' : '1px solid #cbd5e1',
                background: filterFacility === 'all' ? '#047857' : '#ffffff',
                color: filterFacility === 'all' ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {isAr ? 'الكل' : 'Tous'}
            </button>
            <button
              type="button"
              onClick={() => setFilterFacility('terrasse')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: filterFacility === 'terrasse' ? '1.5px solid #047857' : '1px solid #cbd5e1',
                background: filterFacility === 'terrasse' ? '#047857' : '#ffffff',
                color: filterFacility === 'terrasse' ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              🌇 {isAr ? 'السطح' : 'Terrasse'}
            </button>
            <button
              type="button"
              onClick={() => setFilterFacility('salle')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: filterFacility === 'salle' ? '1.5px solid #047857' : '1px solid #cbd5e1',
                background: filterFacility === 'salle' ? '#047857' : '#ffffff',
                color: filterFacility === 'salle' ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              🏛️ {isAr ? 'القاعة' : 'Salle'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(res => {
            const isApproved = res.status === 'approuve'
            const isPending = res.status === 'en_attente'
            const isRejected = res.status === 'refuse'

            return (
              <div
                key={res.id}
                style={{
                  background: '#ffffff',
                  border: isApproved ? '1px solid #bbf7d0' : isPending ? '1.5px solid #fde68a' : '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{res.facility_icon || '📅'}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>
                        {res.facility_name}
                      </strong>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isApproved ? '#dcfce7' : isPending ? '#fef3c7' : '#fee2e2',
                        color: isApproved ? '#15803d' : isPending ? '#92400e' : '#b91c1c'
                      }}>
                        {isApproved
                          ? (isAr ? '✅ مقبول' : '✅ Approuvé')
                          : isPending
                          ? (isAr ? '⏳ في انتظار الموافقة' : '⏳ En attente')
                          : (isAr ? '❌ مرفوض' : '❌ Refusé')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: '2px' }}>
                      📅 <strong>{res.date}</strong> · ⏰ <strong>{res.time_slot}</strong>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      👤 {res.resident_name} {res.apartment_number && `(Appt ${res.apartment_number})`} · <em>{res.purpose}</em>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {res.phone && (
                    <a
                      href={`https://wa.me/212${res.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                        isAr
                          ? `السلام عليكم بخصوص حجز ${res.facility_name} ليوم ${res.date} (${res.time_slot}).`
                          : `Bonjour concernant votre réservation de ${res.facility_name} le ${res.date} (${res.time_slot}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#25D366',
                        color: '#ffffff',
                        padding: '6px 10px',
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
                  )}

                  {canManage && isPending && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(res.id, 'approuve')}
                        style={{
                          background: '#047857',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isAr ? 'قبول' : 'Valider'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(res.id, 'refuse')}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {isAr ? 'رفض' : 'Refuser'}
                      </button>
                    </div>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(res.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.6 }}
                      title={isAr ? 'حذف' : 'Supprimer'}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              {isAr ? 'لا توجد حجوزات مسجلة حالياً.' : 'Aucune réservation trouvée.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Reservation Form */}
      {showAddModal && (
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
          <div className="card" style={{ maxWidth: '460px', width: '100%', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span>
              {isAr ? 'طلب حجز مرفق مشترك' : 'Nouvelle demande de réservation'}
            </h3>

            <form onSubmit={handleCreateReservation}>
              <label>
                {isAr ? 'المرفق المطلوب حكزه *' : 'Équipement à réserver *'}
                <select
                  value={form.facility_id}
                  onChange={e => setForm({ ...form, facility_id: e.target.value })}
                >
                  <option value="stah">🌇 Terrasse Commune (السطح / Stah)</option>
                  <option value="salle">🏛️ Salle polyvalente / Réunions (القاعة)</option>
                  <option value="jardin">🌳 Jardin & Espace commun (الحديقة)</option>
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'تاريخ الحجز *' : 'Date de réservation *'}
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'الفترة الزمنية *' : 'Créneau horaire *'}
                  <select
                    value={form.time_slot}
                    onChange={e => setForm({ ...form, time_slot: e.target.value })}
                  >
                    <option value="09:00 - 13:00">Matin (09:00 - 13:00)</option>
                    <option value="14:00 - 18:00">Après-midi (14:00 - 18:00)</option>
                    <option value="18:00 - 22:00">Soirée (18:00 - 22:00)</option>
                    <option value="Journée entière">Journée entière (09:00 - 20:00)</option>
                  </select>
                </label>
              </div>

              <label>
                {isAr ? 'الهدف من الحجز أو طبيعة النشاط *' : 'Motif ou objet de l’utilisation *'}
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: تركيب صحن مقعر، تنظيف ألواح، حفلة عائلية...' : 'ex: Travaux antenne satellite, fête familiale calme...'}
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                />
              </label>

              <label>
                {isAr ? 'ملاحظة إضافية' : 'Précisions complémentaires'}
                <input
                  type="text"
                  placeholder={isAr ? 'أي معلومة إضافية للسنديك أو الحارس...' : 'ex: Clé demandée la veille...'}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </label>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: '#64748b',
                marginTop: '12px'
              }}>
                ℹ️ {isAr
                  ? 'بالضغط على تأكيد، تتعهد باحترام القانون الداخلي للإقامة، الهدوء، وإعادة المكان نظيفاً بعد انتهاء الفترة.'
                  : 'En confirmant, vous vous engagez à respecter le calme du voisinage et à restituer les lieux en parfait état de propreté.'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-primary">
                  {isAr ? 'إرسال طلب الحجز' : 'Confirmer la réservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
