import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function MisesEnDemeurePanel({ canManage = true }) {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [misesEnDemeure, setMisesEnDemeure] = useState([])
  const [unpaidResidents, setUnpaidResidents] = useState([])
  const [bankInfo, setBankInfo] = useState(null)
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form for generating a new notice
  const [form, setForm] = useState({
    resident_name: '',
    apartment_number: '',
    phone: '',
    total_due: '',
    overdue_months: '',
    delivery_method: 'Lettre recommandée avec accusé de réception (AR)'
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const resMED = await supabase.from('mises_en_demeure').select('*')
      setMisesEnDemeure(resMED.data || [])

      // Load unpaid charges to find defaulting residents
      const resPayments = await supabase.from('payments').select('*').eq('status', 'pending')
      const resProfiles = await supabase.from('profiles').select('*')
      const profilesMap = (resProfiles.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {})

      // Group unpaid by resident
      const unpaidMap = {}
      ;(resPayments.data || []).forEach(pay => {
        const uId = pay.resident_id
        const user = profilesMap[uId] || { full_name: 'Copropriétaire', apartment_number: 'N/A', phone: '' }
        if (!unpaidMap[uId]) {
          unpaidMap[uId] = {
            id: uId,
            full_name: user.full_name,
            apartment_number: user.apartment_number,
            phone: user.phone,
            total_due: 0,
            months: []
          }
        }
        unpaidMap[uId].total_due += Number(pay.amount) || 0
        unpaidMap[uId].months.push(pay.month || 'Mois échu')
      })

      setUnpaidResidents(Object.values(unpaidMap))

      // Bank info for notice letter
      try {
        const rawBank = localStorage.getItem('syndic_maroc_bank_info')
        if (rawBank) setBankInfo(JSON.parse(rawBank))
      } catch (e) {}
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCreate(resident) {
    setForm({
      resident_name: resident?.full_name || '',
      apartment_number: resident?.apartment_number || '',
      phone: resident?.phone || '',
      total_due: resident?.total_due || '',
      overdue_months: resident?.months?.join(', ') || 'Plusieurs mois échus',
      delivery_method: 'Lettre recommandée avec accusé de réception (AR)'
    })
    setShowGenerateModal(true)
  }

  async function handleSaveNotice(e) {
    e.preventDefault()
    if (!form.resident_name || !form.total_due) return

    const ref = `MED-${new Date().getFullYear()}-${String(misesEnDemeure.length + 1).padStart(3, '0')}`

    const newRecord = {
      ...form,
      reference_code: ref,
      sent_date: new Date().toISOString().split('T')[0],
      legal_deadline_days: 30,
      status: 'envoyee',
      residence_id: profile?.residence_id || 'res-andalous-1'
    }

    await supabase.from('mises_en_demeure').insert(newRecord)
    setShowGenerateModal(false)
    setSelectedNotice(newRecord)
    loadData()
  }

  function printNotice() {
    window.print()
  }

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
            <span>⚖️</span>
            {isAr ? 'الإنذارات القانونية للمتأخرين (القانون 18-00)' : 'Mises en Demeure & Recouvrement (Loi 18-00)'}
          </h2>
          <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '0.86rem' }}>
            {isAr
              ? 'توليد إنذارات رسمية مطابقة للمادة 25 من قانون الملكية المشتركة المغربي مع أجل 30 يوماً والمتابعة القضائية'
              : 'Génération de mises en demeure formelles conformes à l’Article 25 de la Loi 18-00 avec délai légal de 30 jours'}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenCreate(null)}
            style={{ fontWeight: 700, fontSize: '0.84rem', background: '#991b1b', borderColor: '#991b1b' }}
          >
            <span>⚖️</span>
            {isAr ? 'إنشاء إنذار قانوني جديد' : 'Créer une mise en demeure'}
          </button>
        )}
      </div>

      {/* Legal Reference Banner (Loi 18-00 Article 25) */}
      <div style={{
        background: '#fffbeb',
        border: '1.5px solid #fde68a',
        borderRadius: '12px',
        padding: '14px 18px',
        fontSize: '0.84rem',
        color: '#92400e',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>📜</span>
        <div>
          <strong style={{ display: 'block', fontSize: '0.92rem', color: '#78350f', marginBottom: '4px' }}>
            {isAr
              ? 'المقتضيات القانونية (المادتان 25 و26 من ظهير 1-02-298 المنظم للملكية المشتركة بالمغرب) :'
              : 'Dispositions Légales — Articles 25 et 26 de la Loi 18-00 (Dahir n° 1-02-298) :'}
          </strong>
          {isAr
            ? 'إذا تخلف المالك المشترك عن أداء واجبات الصيانة، يوجه إليه السنديك إنذاراً رسمياً بالأداء داخل أجل 30 يوماً. وبعد انقضاء الأجل، يحق للسنديك استصدار أمر بالأداء (Injonction de payer) من رئيس المحكمة الابتدائية مشمول بالنفاذ المعجل، وتقييد رهن رسمي إجباري (Hypothèque légale) على الشقة المعنية لضمان دين السنديك.'
            : 'En cas de défaut de paiement des charges, le syndic adresse au copropriétaire défaillant une mise en demeure d’avoir à s’exécuter dans un délai de 30 jours. Passé ce délai, le syndic peut saisir le Président du Tribunal de Première Instance en référé pour ordonnance d’injonction de payer (exécutoire par provision) et inscrire une hypothèque légale sur le lot privatif.'}
        </div>
      </div>

      {/* SECTION 1: Defaulting Residents with 1-click Notice Generation */}
      {canManage && unpaidResidents.length > 0 && (
        <div className="card" style={{ padding: '18px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            {isAr ? `الملاك الذين عليهم متأخرات مالية (${unpaidResidents.length})` : `Copropriétaires en situation d'impayés (${unpaidResidents.length})`}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {unpaidResidents.map(u => (
              <div
                key={u.id}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.94rem', color: '#991b1b' }}>
                    {u.full_name} {u.apartment_number && `· Appt ${u.apartment_number}`}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#7f1d1d', marginTop: '2px' }}>
                    {isAr ? 'الأشهر غير المؤداة : ' : 'Mois en souffrance : '} {u.months.join(', ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#b91c1c' }}>
                      {u.total_due} MAD
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#991b1b' }}>
                      {isAr ? 'مجموع المتأخرات' : 'Total dû'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCreate(u)}
                    style={{
                      background: '#991b1b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(153, 27, 27, 0.25)'
                    }}
                  >
                    <span>⚖️</span>
                    {isAr ? 'توليد الإنذار القانوني' : 'Générer la Mise en Demeure'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: List of Issued Formal Notices */}
      <div className="card" style={{ padding: '18px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#0f172a' }}>
          📋 {isAr ? `سجل الإنذارات القانونية الصادرة (${misesEnDemeure.length})` : `Registre des Mises en Demeure délivrées (${misesEnDemeure.length})`}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {misesEnDemeure.map(med => {
            const sentDate = new Date(med.sent_date)
            const daysPassed = Math.floor((Date.now() - sentDate.getTime()) / 86400000)
            const daysRemaining = Math.max(0, (med.legal_deadline_days || 30) - daysPassed)
            const isExpired = daysRemaining === 0

            return (
              <div
                key={med.id}
                style={{
                  background: '#ffffff',
                  border: isExpired ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      background: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#0f172a'
                    }}>
                      {med.reference_code}
                    </span>
                    <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                      {med.resident_name} {med.apartment_number && `· Appt ${med.apartment_number}`}
                    </strong>
                  </div>

                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    {isAr ? 'تاريخ الإرسال :' : 'Délivrée le :'} {med.sent_date} · {med.delivery_method}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Countdown status */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: isExpired ? '#fee2e2' : '#fef3c7',
                    color: isExpired ? '#b91c1c' : '#92400e'
                  }}>
                    {isExpired
                      ? (isAr ? '⚖️ انقضى أجل 30 يوماً — جاهز للمحكمة' : '⚖️ Délai 30j expiré — Phase judiciaire')
                      : (isAr ? `⏳ متبقي ${daysRemaining} يوماً للأداء` : `⏳ Reste ${daysRemaining} jours`)}
                  </div>

                  <strong style={{ fontSize: '1.05rem', color: '#b91c1c' }}>
                    {med.total_due} MAD
                  </strong>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedNotice(med)}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', fontWeight: 700 }}
                    >
                      👁️ {isAr ? 'معاينة وطباعة' : 'Afficher / Imprimer'}
                    </button>

                    {med.phone && (
                      <a
                        href={`https://wa.me/212${med.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                          isAr
                            ? `تذكير قانوني رسمي من سنديك إقامة الأندلس:\nنحيطكم علماً بأنه قد تم توجيه رسالة إنذار رسمي رقم ${med.reference_code} بخصوص متأخرات المساهمات البالغة ${med.total_due} درهم طبقا للمادة 25 من القانون 18-00. يرجى تسوية الوضعية داخل الأجل القانوني لتفادي المتابعة القضائية.`
                            : `Rappel Juridique Officiel — Syndic Résidence Al Andalous:\nNous vous informons qu'une mise en demeure formelle réf: ${med.reference_code} vous a été délivrée pour un impayé de ${med.total_due} MAD (Loi 18-00, art. 25). Merci de régulariser dans le délai légal imparti pour éviter la procédure judiciaire.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {misesEnDemeure.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              {isAr ? 'لا توجد إنذارات قانونية صادرة حتى الآن.' : 'Aucune mise en demeure émise.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Form to Generate Notice */}
      {showGenerateModal && (
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
          <div className="card" style={{ maxWidth: '500px', width: '100%', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚖️</span>
              {isAr ? 'توليد إنذار قانوني رسمي (Loi 18-00)' : 'Établir une Mise en Demeure'}
            </h3>

            <form onSubmit={handleSaveNotice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'اسم الساكن / المالك *' : 'Nom du copropriétaire *'}
                  <input
                    type="text"
                    required
                    value={form.resident_name}
                    onChange={e => setForm({ ...form, resident_name: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'رقم الشقة' : 'N° Appartement'}
                  <input
                    type="text"
                    value={form.apartment_number}
                    onChange={e => setForm({ ...form, apartment_number: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {isAr ? 'مجموع المبلغ الواجب أداؤه (درهم) *' : 'Montant total dû (MAD) *'}
                  <input
                    type="number"
                    required
                    value={form.total_due}
                    onChange={e => setForm({ ...form, total_due: e.target.value })}
                  />
                </label>

                <label>
                  {isAr ? 'هاتف المعني بالأمر' : 'Téléphone'}
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
              </div>

              <label>
                {isAr ? 'تفصيل الأشهر غير المؤداة *' : 'Détail des mois impayés *'}
                <input
                  type="text"
                  required
                  placeholder="ex: Juin, Juillet, Août, Septembre 2026"
                  value={form.overdue_months}
                  onChange={e => setForm({ ...form, overdue_months: e.target.value })}
                />
              </label>

              <label>
                {isAr ? 'طريقة التبليغ الرسمية' : 'Mode de notification'}
                <select
                  value={form.delivery_method}
                  onChange={e => setForm({ ...form, delivery_method: e.target.value })}
                >
                  <option value="Lettre recommandée avec accusé de réception (AR)">Lettre recommandée avec accusé de réception (AR)</option>
                  <option value="Notification par Huissier de Justice (مفوض قضائي)">Notification par Huissier de Justice (مفوض قضائي)</option>
                  <option value="Remise en main propre contre décharge datée et signée">Remise en main propre contre décharge datée</option>
                  <option value="Notification électronique officielle par WhatsApp / E-mail">Notification électronique officielle</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: '#991b1b', borderColor: '#991b1b' }}
                >
                  {isAr ? 'تأكيد وتوليد الوثيقة' : 'Valider & Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Printable Formal Notice (A4 Document Format) */}
      {selectedNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px'
        }}>
          <div className="card printable-document" style={{
            maxWidth: '750px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '36px 40px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            color: '#0f172a',
            fontFamily: 'serif'
          }}>
            {/* Action Bar (Not printed) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={printNotice}
                  style={{
                    background: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🖨️ {isAr ? 'طباعة الوثيقة الرسمية (A4)' : 'Imprimer la Mise en Demeure (A4)'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Official Letter Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '24px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  ROYAUME DU MAROC
                </strong>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>
                  SYNDICAT DES COPROPRIÉTAIRES
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                  RÉSIDENCE AL ANDALOUS — CASABLANCA
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  142 Boulevard d’Anfa · Casablanca
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                  RÉF : {selectedNotice.reference_code}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                  Casablanca, le {selectedNotice.sent_date}
                </div>
              </div>
            </div>

            {/* Recipient Block */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '24px',
              maxWidth: '380px',
              marginLeft: 'auto'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Destinataire :</span>
              <strong style={{ display: 'block', fontSize: '1rem', marginTop: '2px' }}>
                À l’attention de M. / Mme {selectedNotice.resident_name}
              </strong>
              {selectedNotice.apartment_number && (
                <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                  Copropriétaire du Lot / Appartement : {selectedNotice.apartment_number}
                </div>
              )}
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Mode de notification : {selectedNotice.delivery_method}
              </div>
            </div>

            {/* Document Title */}
            <div style={{ textAlign: 'center', margin: '20px 0 24px 0' }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#991b1b',
                borderBottom: '2px solid #991b1b',
                display: 'inline-block',
                paddingBottom: '4px'
              }}>
                LETTRE DE MISE EN DEMEURE FORMELLE
              </h2>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginTop: '6px' }}>
                EN APPLICATION DES ARTICLES 25 ET 26 DE LA LOI N° 18-00 RELATIVE À LA COPROPRIÉTÉ
              </div>
            </div>

            {/* Letter Body */}
            <div style={{ fontSize: '0.92rem', lineHeight: '1.7', textAlign: 'justify', color: '#1e293b' }}>
              <p>
                Madame, Monsieur,
              </p>
              <p>
                En notre qualité de Syndic légalement élu de la <strong>Résidence Al Andalous</strong>, régie par les dispositions du <strong>Dahir n° 1-02-298 du 3 octobre 2002 portant promulgation de la Loi n° 18-00</strong> relative au statut de la copropriété des immeubles bâtis, nous constatons qu’à ce jour et malgré nos relances cordiales préalables, vous restez redevable envers le syndicat des charges communes de copropriété pour votre appartement n° <strong>{selectedNotice.apartment_number || 'défini au titre foncier'}</strong>.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                padding: '12px 16px',
                margin: '16px 0',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Période / Mois concernés :</span>
                  <strong>{selectedNotice.overdue_months}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', fontSize: '1.05rem', color: '#991b1b' }}>
                  <strong>MONTANT TOTAL RESTANT DÛ :</strong>
                  <strong>{selectedNotice.total_due} DIRHAMS (MAD)</strong>
                </div>
              </div>

              <p>
                En conséquence, <strong>NOUS VOUS METTONS FORMELLEMENT EN DEMEURE</strong> par la présente d’avoir à vous acquitter de ladite somme de <strong>{selectedNotice.total_due} MAD</strong> dans un <strong>délai impératif de TRENTE (30) JOURS</strong> à compter de la réception de la présente.
              </p>

              {bankInfo && bankInfo.rib && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  margin: '12px 0'
                }}>
                  <strong>Coordonnées bancaires pour virement :</strong><br />
                  Banque : {bankInfo.banque_nom || 'Banque'} · Bénéficiaire : {bankInfo.titulaire || 'Syndicat des Copropriétaires'}<br />
                  <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>RIB : {bankInfo.rib}</span>
                </div>
              )}

              <p style={{ fontWeight: 600 }}>
                À défaut de complet règlement dans ce délai de 30 jours, nous nous verrons dans l’obligation légale d’engager à votre encontre, sans autre préavis :
              </p>

              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>
                  Une procédure d’<strong>ordonnance d’injonction de payer</strong> devant Monsieur le Président du Tribunal de Première Instance, exécutoire par provision conformément à l’article 25 de la Loi 18-00 ;
                </li>
                <li>
                  L’inscription d’une <strong>hypothèque légale forcée</strong> sur votre lot de copropriété auprès de la Conservation Foncière (Art. 26) ;
                </li>
                <li>
                  La réclamation de l’ensemble des dépens, frais de justice et intérêts de retard légaux.
                </li>
              </ul>

              <p>
                Espérant ne pas avoir à recourir à ces voies contentieuses, nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.
              </p>
            </div>

            {/* Signature Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Mention manuscrite de réception :</span>
                <div style={{ height: '50px', borderBottom: '1px dotted #cbd5e1', width: '220px', marginTop: '6px' }}></div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <strong>Pour le Syndicat des Copropriétaires</strong>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>Le Syndic en exercice</div>
                <div style={{
                  marginTop: '10px',
                  width: '140px',
                  height: '70px',
                  border: '2px dashed #047857',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  color: '#047857',
                  fontWeight: 700,
                  transform: 'rotate(-4deg)'
                }}>
                  CACHET DU SYNDICAT<br />& SIGNATURE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
