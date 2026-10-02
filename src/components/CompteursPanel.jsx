import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function CompteursPanel({ canManage = true }) {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [compteurs, setCompteurs] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all' | 'eau' | 'electricite'
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    type: 'eau',
    label: '',
    compteur_num: '',
    previous_index: '',
    current_index: '',
    period: 'Octobre 2026',
    estimated_price_per_unit: 12, // ~12 DH/m3 for water or ~1.2 DH/kWh for elec
    note: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await supabase.from('compteurs').select('*')
      setCompteurs(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Calculate live consumption in form
  const prevVal = Number(form.previous_index) || 0
  const curVal = Number(form.current_index) || 0
  const calculatedConsumption = Math.max(0, curVal - prevVal)
  const unit = form.type === 'eau' ? 'm³' : 'kWh'
  const estimatedTotalCost = Math.round(calculatedConsumption * Number(form.estimated_price_per_unit || (form.type === 'eau' ? 12 : 1.2)))

  // Abnormal consumption detection (> 60 m3 for common water or > 800 kWh)
  const isAbnormal = form.type === 'eau' ? calculatedConsumption > 60 : calculatedConsumption > 900

  async function handleSaveReading(e) {
    e.preventDefault()
    if (!form.label || !form.current_index) return

    const newReading = {
      type: form.type,
      label: form.label,
      compteur_num: form.compteur_num || 'CPT-' + Math.floor(10000 + Math.random() * 90000),
      previous_index: prevVal,
      current_index: curVal,
      consumption: calculatedConsumption,
      unit,
      period: form.period,
      read_date: new Date().toISOString().split('T')[0],
      estimated_cost: estimatedTotalCost,
      is_leak_alert: isAbnormal,
      note: form.note || (isAbnormal ? 'Alerte: Consommation élevée à vérifier' : 'Relevé mensuel conforme'),
      residence_id: profile?.residence_id || 'res-andalous-1'
    }

    await supabase.from('compteurs').insert(newReading)
    setShowAddModal(false)
    setForm({
      type: 'eau',
      label: '',
      compteur_num: '',
      previous_index: '',
      current_index: '',
      period: 'Octobre 2026',
      estimated_price_per_unit: 12,
      note: ''
    })
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm(isAr ? 'هل تريد حذف هذا التقرير؟' : 'Supprimer ce relevé ?')) return
    await supabase.from('compteurs').delete().eq('id', id)
    loadData()
  }

  const filtered = compteurs.filter(c => filterType === 'all' || c.type === filterType)

  const totalEauM3 = compteurs
    .filter(c => c.type === 'eau')
    .reduce((sum, c) => sum + (Number(c.consumption) || 0), 0)

  const totalElecKwh = compteurs
    .filter(c => c.type === 'electricite')
    .reduce((sum, c) => sum + (Number(c.consumption) || 0), 0)

  const hasLeakAlert = compteurs.some(c => c.is_leak_alert)

  return (
    <div className="panel">
      {/* Top Banner & KPI Summary */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡💧</span>
            {isAr ? 'تتبع عدادات الماء والكهرباء المشتركة' : 'Suivi des Compteurs Eau & Électricité'}
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.86rem' }}>
            {isAr
              ? 'مراقبة الاستهلاك الشهري للأجزاء المشتركة، كشف تسربات المياه، وضبط الفواتير'
              : 'Relevé mensuel des parties communes, détection précoce des fuites et suivi budgétaire'}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ fontWeight: 700, fontSize: '0.84rem' }}
          >
            <span>➕</span>
            {isAr ? 'تسجيل قراءة عداد جديدة' : 'Enregistrer un relevé'}
          </button>
        )}
      </div>

      {/* KPI Cards: Water, Electricity, Leak Alert */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* Water KPI */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              {isAr ? 'استهلاك الماء المشترك' : 'Eau parties communes'}
            </span>
            <span style={{ fontSize: '1.4rem' }}>💧</span>
          </div>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: '#0c4a6e', marginTop: '6px' }}>
            {totalEauM3} m³
          </strong>
          <span style={{ fontSize: '0.78rem', color: '#0284c7' }}>
            ~ {Math.round(totalEauM3 * 12)} DH ({isAr ? 'تكلفة تقديرية' : 'coût estimé'})
          </span>
        </div>

        {/* Electricity KPI */}
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)',
          border: '1px solid #fef08a',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a16207', textTransform: 'uppercase' }}>
              {isAr ? 'استهلاك الكهرباء المشترك' : 'Électricité communes'}
            </span>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
          </div>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: '#713f12', marginTop: '6px' }}>
            {totalElecKwh} kWh
          </strong>
          <span style={{ fontSize: '0.78rem', color: '#b45309' }}>
            ~ {Math.round(totalElecKwh * 1.2)} DH ({isAr ? 'تكلفة تقديرية' : 'coût estimé'})
          </span>
        </div>

        {/* Leak Alert Status */}
        <div style={{
          background: hasLeakAlert ? '#fff1f2' : '#f0fdf4',
          border: `1px solid ${hasLeakAlert ? '#fecdd3' : '#bbf7d0'}`,
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasLeakAlert ? '#be123c' : '#15803d', textTransform: 'uppercase' }}>
              {isAr ? 'مؤشر التسربات المائية' : 'Détection de fuites'}
            </span>
            <span style={{ fontSize: '1.4rem' }}>{hasLeakAlert ? '⚠️' : '✅'}</span>
          </div>
          <strong style={{ display: 'block', fontSize: '1.1rem', color: hasLeakAlert ? '#9f1239' : '#14532d', marginTop: '6px' }}>
            {hasLeakAlert
              ? (isAr ? 'تنبيه: اشتباه في تسرب مياه!' : 'Alerte: Fuite suspectée !')
              : (isAr ? 'الاستهلاك طبيعي ولا توجد تسربات' : 'Réseau sain — Pas de fuite')}
          </strong>
          <span style={{ fontSize: '0.76rem', color: hasLeakAlert ? '#e11d48' : '#16a34a' }}>
            {hasLeakAlert
              ? (isAr ? 'تم رصد ارتفاع غير عادي في الاستهلاك' : 'Surconsommation anormale relevée')
              : (isAr ? 'كافة العدادات تحت السيطرة' : 'Tous les compteurs sont stables')}
          </span>
        </div>
      </div>

      {/* Leak Prevention Moroccan Advice Box */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '0.84rem',
        color: '#475569',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>💡</span>
        <div>
          <strong style={{ color: '#0f172a' }}>
            {isAr ? 'نصيحة تقنية لسنديك الإقامة :' : 'Conseil technique syndic :'}
          </strong>{' '}
          {isAr
            ? 'فـ أغلب العمارات، كيكونو تسربات المياه مخفية فـ عوامة الخزان الأرضي (Flotteur de bâche à eau) أو رشاشات سقي الحديقة، وهادشي كيقدر يضيع آلاف الدراهم شهرياً بلا ما يعيق به حد. تسجيل الـ Index كل شهر كيحميك من المفاجآت!'
            : 'Dans la majorité des copropriétés, les fuites silencieuses proviennent du flotteur de la bâche à eau ou des arroseurs de jardin, causant des factures exorbitantes. Relever l’index le 30 de chaque mois permet de détecter l’anomalie avant l’arrivée de la facture !'}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { key: 'all', label: isAr ? 'جميع العدادات' : 'Tous les compteurs' },
          { key: 'eau', label: isAr ? '💧 عدادات الماء' : '💧 Compteurs Eau' },
          { key: 'electricite', label: isAr ? '⚡ عدادات الكهرباء' : '⚡ Compteurs Électricité' }
        ].map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilterType(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: filterType === f.key ? '1.5px solid #047857' : '1px solid #cbd5e1',
              background: filterType === f.key ? '#047857' : '#ffffff',
              color: filterType === f.key ? '#ffffff' : '#475569'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* History Cards / Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(c => {
          const isEau = c.type === 'eau'
          return (
            <div
              key={c.id}
              style={{
                background: '#ffffff',
                border: c.is_leak_alert ? '1.5px solid #fda4af' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: isEau ? '#e0f2fe' : '#fef9c3',
                  color: isEau ? '#0369a1' : '#a16207',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0
                }}>
                  {isEau ? '💧' : '⚡'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                      {c.label}
                    </strong>
                    {c.is_leak_alert && (
                      <span style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        ⚠️ ALERTE FUITE
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    N° {c.compteur_num} · {c.period} ({c.read_date})
                  </span>
                </div>
              </div>

              {/* Index details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                    {isAr ? 'الرقم السابق' : 'Ancien Index'}
                  </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {c.previous_index}
                  </strong>
                </div>

                <span style={{ color: '#94a3b8', fontSize: '1rem' }}>➡️</span>

                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                    {isAr ? 'الرقم الحالي' : 'Nouvel Index'}
                  </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#047857' }}>
                    {c.current_index}
                  </strong>
                </div>

                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: c.is_leak_alert ? '#e11d48' : '#0f172a' }}>
                    {c.consumption} {c.unit}
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    ~ {c.estimated_cost} MAD
                  </span>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6 }}
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
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
            {isAr ? 'لا توجد قراءات مسجلة حالياً.' : 'Aucun relevé pour le moment.'}
          </div>
        )}
      </div>

      {/* Modal: Enregistrer un nouveau relevé */}
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
          <div className="card" style={{ maxWidth: '480px', width: '100%', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡💧</span>
              {isAr ? 'تسجيل قراءة عداد جديدة' : 'Nouveau relevé de compteur'}
            </h3>

            <form onSubmit={handleSaveReading}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'نوع العداد *' : 'Type de compteur *'}
                  <select
                    value={form.type}
                    onChange={e => setForm({
                      ...form,
                      type: e.target.value,
                      estimated_price_per_unit: e.target.value === 'eau' ? 12 : 1.2
                    })}
                  >
                    <option value="eau">💧 Eau (الماء)</option>
                    <option value="electricite">⚡ Électricité (الكهرباء)</option>
                  </select>
                </label>

                <label>
                  {isAr ? 'الشهر / الفترة' : 'Période / Mois'}
                  <input
                    type="text"
                    required
                    placeholder="ex: Octobre 2026"
                    value={form.period}
                    onChange={e => setForm({ ...form, period: e.target.value })}
                  />
                </label>
              </div>

              <label>
                {isAr ? 'اسم أو موقع العداد *' : 'Nom / Emplacement du compteur *'}
                <input
                  type="text"
                  required
                  placeholder={form.type === 'eau' ? 'ex: Compteur Eau Jardin & Hall' : 'ex: Compteur Ascenseur & Éclairage'}
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                />
              </label>

              <label>
                {isAr ? 'رقم العداد (Police / N° Compteur)' : 'N° de Police / Compteur'}
                <input
                  type="text"
                  placeholder="ex: RAD-CAS-488219"
                  value={form.compteur_num}
                  onChange={e => setForm({ ...form, compteur_num: e.target.value })}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'القراءة السابقة (Ancien)' : 'Ancien Index'}
                  <input
                    type="number"
                    step="any"
                    placeholder="ex: 1240"
                    value={form.previous_index}
                    onChange={e => setForm({ ...form, previous_index: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'القراءة الجديدة (Nouveau) *' : 'Nouvel Index *'}
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="ex: 1262"
                    value={form.current_index}
                    onChange={e => setForm({ ...form, current_index: e.target.value })}
                  />
                </label>
              </div>

              {/* Real-time Calculation Result Preview */}
              <div style={{
                background: isAbnormal ? '#fff1f2' : '#f0fdf4',
                border: `1.5px solid ${isAbnormal ? '#fecdd3' : '#bbf7d0'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: isAbnormal ? '#9f1239' : '#166534', fontWeight: 600 }}>
                    {isAr ? 'الاستهلاك المحسوب تلقائياً :' : 'Consommation calculée :'}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: isAbnormal ? '#be123c' : '#14532d' }}>
                    {calculatedConsumption} {unit}
                  </strong>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {isAr ? 'التكلفة التقريبية :' : 'Coût estimé :'}
                  </span>
                  <strong style={{ display: 'block', fontSize: '1.15rem', color: '#0f172a' }}>
                    ~ {estimatedTotalCost} MAD
                  </strong>
                </div>
              </div>

              {isAbnormal && (
                <div style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  marginBottom: '12px'
                }}>
                  ⚠️ {isAr
                    ? 'انتباه : هذا الاستهلاك مرتفع جداً مقارنة بالمعدل الطبيعي للأجزاء المشتركة. يرجى فحص الأنابيب والتأكد من عدم وجود تسرب ماء.'
                    : 'Attention : Cette consommation est anormalement élevée. Veuillez vérifier l’absence de fuites sur le réseau avant validation.'}
                </div>
              )}

              <label>
                {isAr ? 'ملاحظة' : 'Remarque'}
                <input
                  type="text"
                  placeholder={isAr ? 'اختياري...' : 'Facultatif...'}
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="btn-primary">
                  {isAr ? 'تسجيل القراءة' : 'Enregistrer le relevé'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
