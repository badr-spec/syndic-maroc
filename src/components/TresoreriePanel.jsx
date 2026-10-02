import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { exportToExcel } from '../lib/exportExcel'

export default function TresoreriePanel() {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [payments, setPayments] = useState([])
  const [virements, setVirements] = useState([])
  const [extraExpenses, setExtraExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    motif: '',
    amount: '',
    category: 'electricite',
    beneficiaire: '',
    date: new Date().toISOString().slice(0, 10)
  })

  // Load financial flows
  async function loadFinances() {
    setLoading(true)
    // 1. Recettes (Cotisations payées)
    const { data: payData } = await supabase
      .from('payments')
      .select('id, amount, status, paid_at, note, profiles:paid_by(full_name, apartment_number)')
      .eq('residence_id', profile.residence_id)
    setPayments(payData || [])

    // 2. Factures et virements sociétés
    const { data: virData } = await supabase
      .from('virements')
      .select('*')
      .eq('residence_id', profile.residence_id)
    setVirements(virData || [])

    // 3. Local extra expenses stored in localStorage for demo/residence
    const storageKey = `syndic_extra_expenses_${profile.residence_id}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setExtraExpenses(JSON.parse(saved))
      } catch (e) {
        setExtraExpenses([])
      }
    } else {
      const initialExpenses = [
        {
          id: 'exp-1',
          motif: isAr ? 'فاتورة كهرباء الدرج والمرآب (ليدك)' : 'Facture électricité éclairage escalier & garage (Régie/Lydec)',
          amount: 320,
          category: 'electricite',
          beneficiaire: 'Lydec / Régie de distribution',
          date: '2026-09-25'
        },
        {
          id: 'exp-2',
          motif: isAr ? 'شراء مصابيح LED ومواد تنظيف المدخل' : 'Achat ampoules LED & produits de nettoyage hall',
          amount: 150,
          category: 'menage',
          beneficiaire: 'Droguerie Al Andalous',
          date: '2026-09-28'
        }
      ]
      setExtraExpenses(initialExpenses)
      localStorage.setItem(storageKey, JSON.stringify(initialExpenses))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadFinances()
  }, [profile])

  async function handleAddExpense(e) {
    e.preventDefault()
    if (!expenseForm.motif || !expenseForm.amount) return

    const newExp = {
      id: `exp-${Date.now()}`,
      motif: expenseForm.motif,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      beneficiaire: expenseForm.beneficiaire || (isAr ? 'مستفيد خارجي' : 'Fournisseur externe'),
      date: expenseForm.date
    }

    const updated = [newExp, ...extraExpenses]
    setExtraExpenses(updated)
    localStorage.setItem(`syndic_extra_expenses_${profile.residence_id}`, JSON.stringify(updated))

    setExpenseForm({
      motif: '',
      amount: '',
      category: 'electricite',
      beneficiaire: '',
      date: new Date().toISOString().slice(0, 10)
    })
    setShowAddExpense(false)
  }

  // Totals calculations
  const totalRecettes = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const totalFacturesPayees = virements
    .filter(v => v.doc_status === 'paye')
    .reduce((sum, v) => sum + (Number(v.amount) || 0), 0)

  const totalExtraDepenses = extraExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalDepenses = totalFacturesPayees + totalExtraDepenses
  const soldeDisponible = totalRecettes - totalDepenses

  const facturesEnAttente = virements
    .filter(v => v.doc_status !== 'paye' && v.kind === 'facture')
    .reduce((sum, v) => sum + (Number(v.amount) || 0), 0)

  function handleExportTresorerieExcel() {
    const rows = []

    payments.filter(p => p.status === 'paid').forEach(p => {
      rows.push({
        [isAr ? 'التاريخ' : 'Date']: new Date(p.paid_at || Date.now()).toLocaleDateString('fr-FR'),
        [isAr ? 'نوع الحركة' : 'Type de Flux']: isAr ? 'مدخول (مساهمة)' : 'RECETTE (Entrée)',
        [isAr ? 'البيان' : 'Désignation / Motif']: p.note || (isAr ? 'مساهمة السنديك' : 'Cotisation de copropriété'),
        [isAr ? 'المستفيد / المؤدي' : 'Tiers / Bénéficiaire / Payeur']: p.profiles?.full_name ? `${p.profiles.full_name} (${p.profiles.apartment_number || ''})` : (isAr ? 'ساكن' : 'Résident'),
        [isAr ? 'مبلغ المدخول (درهم)' : 'Montant Entrée (MAD)']: Number(p.amount) || 0,
        [isAr ? 'مبلغ المصروف (درهم)' : 'Montant Sortie (MAD)']: 0,
        [isAr ? 'الحالة' : 'Statut']: isAr ? 'تم التحصيل' : 'Encaissé'
      })
    })

    virements.filter(v => v.doc_status === 'paye').forEach(v => {
      rows.push({
        [isAr ? 'التاريخ' : 'Date']: new Date(v.created_at || Date.now()).toLocaleDateString('fr-FR'),
        [isAr ? 'نوع الحركة' : 'Type de Flux']: isAr ? 'مصروف (شركة)' : 'DÉPENSE (Sortie)',
        [isAr ? 'البيان' : 'Désignation / Motif']: v.note || v.reference || (isAr ? 'فاتورة صيانة' : 'Facture prestataire'),
        [isAr ? 'المستفيد / المؤدي' : 'Tiers / Bénéficiaire / Payeur']: isAr ? 'شركة صيانة' : 'Société / Prestataire',
        [isAr ? 'مبلغ المدخول (درهم)' : 'Montant Entrée (MAD)']: 0,
        [isAr ? 'مبلغ المصروف (درهم)' : 'Montant Sortie (MAD)']: Number(v.amount) || 0,
        [isAr ? 'الحالة' : 'Statut']: isAr ? 'تم الأداء' : 'Réglé'
      })
    })

    extraExpenses.forEach(e => {
      rows.push({
        [isAr ? 'التاريخ' : 'Date']: e.date,
        [isAr ? 'نوع الحركة' : 'Type de Flux']: isAr ? 'مصروف مباشر' : 'DÉPENSE (Sortie)',
        [isAr ? 'البيان' : 'Désignation / Motif']: e.motif,
        [isAr ? 'المستفيد / المؤدي' : 'Tiers / Bénéficiaire / Payeur']: e.beneficiaire,
        [isAr ? 'مبلغ المدخول (درهم)' : 'Montant Entrée (MAD)']: 0,
        [isAr ? 'مبلغ المصروف (درهم)' : 'Montant Sortie (MAD)']: Number(e.amount) || 0,
        [isAr ? 'الحالة' : 'Statut']: isAr ? 'تم الأداء' : 'Réglé'
      })
    })

    exportToExcel(
      rows,
      `Bilan_Tresorerie_${(profile.residences?.name || 'Syndic').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      isAr ? 'الخزينة والصندوق' : 'Trésorerie & Caisse'
    )
  }

  if (loading) return <p className="muted">{isAr ? 'جارٍ تحميل الحسابات...' : 'Chargement de la comptabilité...'}</p>

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Action */}
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
            {isAr ? '💰 حصيلة الخزينة وصندوق الإقامة' : '💰 Bilan de Trésorerie & Caisse'}
          </h2>
          <p className="muted small" style={{ margin: '2px 0 0 0' }}>
            {isAr ? 'متابعة المداخيل (المساهمات) والمصاريف (الفواتير والأشغال) والرصيد الصافي للإقامة' : 'Suivi des entrées (cotisations), sorties (dépenses & factures) et solde net de la copropriété'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
            onClick={() => setShowAddExpense(!showAddExpense)}
          >
            {showAddExpense ? (isAr ? '✕ إغلاق' : '✕ Fermer') : (isAr ? '➕ تسجيل مصاريف جديدة' : '➕ Ajouter une dépense')}
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#047857',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={handleExportTresorerieExcel}
          >
            {isAr ? '📊 تصدير حصيلة إكسيل (.xlsx)' : '📊 Exporter Bilan Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px'
      }}>
        {/* Recettes */}
        <div className="card" style={{ padding: '16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
            {isAr ? '📈 إجمالي المداخيل (المساهمات)' : '📈 Total Recettes (Cotisations)'}
          </span>
          <strong style={{ fontSize: '1.4rem', color: '#15803d' }}>
            +{totalRecettes} {isAr ? 'درهم' : 'DH'}
          </strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#166534', marginTop: '4px' }}>
            {isAr ? 'المبالغ المحصلة والمؤكدة' : 'Encaissements validés'}
          </span>
        </div>

        {/* Dépenses */}
        <div className="card" style={{ padding: '16px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>
            {isAr ? '📉 إجمالي المصاريف المؤداة' : '📉 Total Dépenses Payées'}
          </span>
          <strong style={{ fontSize: '1.4rem', color: '#b91c1c' }}>
            -{totalDepenses} {isAr ? 'درهم' : 'DH'}
          </strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#991b1b', marginTop: '4px' }}>
            {isAr ? 'فواتير ومصاريف الأجزاء المشتركة' : 'Factures & charges communes'}
          </span>
        </div>

        {/* Solde Net Disponible */}
        <div className="card" style={{
          padding: '16px',
          background: soldeDisponible >= 0 ? '#ecfdf5' : '#fff1f2',
          border: `2px solid ${soldeDisponible >= 0 ? '#10b981' : '#f43f5e'}`,
          borderRadius: '12px'
        }}>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: soldeDisponible >= 0 ? '#047857' : '#be123c',
            display: 'block',
            marginBottom: '4px'
          }}>
            {isAr ? '🏦 الرصيد الصافي المتاح (البنك / الصندوق)' : '🏦 Solde Net en Banque / Caisse'}
          </span>
          <strong style={{
            fontSize: '1.5rem',
            color: soldeDisponible >= 0 ? '#047857' : '#e11d48'
          }}>
            {soldeDisponible >= 0 ? `+${soldeDisponible}` : soldeDisponible} {isAr ? 'درهم' : 'DH'}
          </strong>
          <span style={{
            display: 'block',
            fontSize: '0.75rem',
            color: soldeDisponible >= 0 ? '#065f46' : '#be123c',
            marginTop: '4px'
          }}>
            {soldeDisponible >= 0 ? (isAr ? '✅ وضعية مالية إيجابية' : '✅ Trésorerie positive') : (isAr ? '⚠️ عجز في الصندوق' : '⚠️ Trésorerie déficitaire')}
          </span>
        </div>

        {/* Factures en attente */}
        <div className="card" style={{ padding: '16px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e', display: 'block', marginBottom: '4px' }}>
            {isAr ? '⏳ فواتير قيد الانتظار' : '⏳ Factures en Attente de Paiement'}
          </span>
          <strong style={{ fontSize: '1.4rem', color: '#b45309' }}>
            {facturesEnAttente} {isAr ? 'درهم' : 'DH'}
          </strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#92400e', marginTop: '4px' }}>
            {isAr ? 'فواتير الشركات الواجب أداؤها' : 'Factures prestataires à régler'}
          </span>
        </div>
      </div>

      {/* Add Direct Expense Form (Collapsible) */}
      {showAddExpense && (
        <div className="card" style={{ border: '2px solid #0284c7', background: '#f0f9ff' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0369a1' }}>
            {isAr ? '➕ تسجيل مصاريف جديدة خاصة بالإقامة' : '➕ Enregistrer une nouvelle dépense de la copropriété'}
          </h3>
          <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700 }}>
                {isAr ? 'بيان الصرف / سبب المصاريف *' : 'Motif de la dépense *'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: فاتورة كهرباء الدرج لشهر شتنبر' : 'Ex: Facture électricité Lydec Septembre'}
                value={expenseForm.motif}
                onChange={e => setExpenseForm({ ...expenseForm, motif: e.target.value })}
                required
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700 }}>
                {isAr ? 'المبلغ (درهم) *' : 'Montant (DH) *'}
              </label>
              <input
                type="number"
                placeholder="Ex: 350"
                value={expenseForm.amount}
                onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
                min="1"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700 }}>
                {isAr ? 'المستفيد / الشركة' : 'Bénéficiaire / Prestataire'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: ليدك / أمانديس / متجر العقاقير' : 'Ex: Lydec / Amendis / Droguerie'}
                value={expenseForm.beneficiaire}
                onChange={e => setExpenseForm({ ...expenseForm, beneficiaire: e.target.value })}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700 }}>
                {isAr ? 'تاريخ الأداء' : 'Date de règlement'}
              </label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button type="submit" className="btn-primary" style={{ padding: '9px 18px', fontWeight: 700 }}>
                {isAr ? 'حفظ المصاريف' : 'Enregistrer la dépense'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddExpense(false)}>
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified Journal / Grand Livre des flux financiers */}
      <div className="card">
        <h3 style={{ margin: '0 0 4px 0' }}>
          {isAr ? '📋 السجل العام للحركات المالية' : '📋 Journal Général des Mouvements Financiers'}
        </h3>
        <p className="muted small" style={{ margin: '0 0 14px 0' }}>
          {isAr ? 'التتبع الزمني لجميع المداخيل والمصاريف' : 'Historique chronologique des encaissements et décaissements'}
        </p>

        <table className="mini-table">
          <thead>
            <tr>
              <th>{isAr ? 'التاريخ' : 'Date'}</th>
              <th>{isAr ? 'نوع الحركة' : 'Flux'}</th>
              <th>{isAr ? 'البيان' : 'Désignation'}</th>
              <th>{isAr ? 'المستفيد / المؤدي' : 'Bénéficiaire / Payeur'}</th>
              <th>{isAr ? 'مدخول (مساهمة)' : 'Entrée (Recette)'}</th>
              <th>{isAr ? 'مصروف' : 'Sortie (Dépense)'}</th>
              <th>{isAr ? 'الحالة' : 'Statut'}</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. Recettes */}
            {payments.filter(p => p.status === 'paid').map(p => (
              <tr key={p.id}>
                <td>{new Date(p.paid_at || Date.now()).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.8rem' }}>
                    {isAr ? '📈 مدخول' : '📈 Entrée'}
                  </span>
                </td>
                <td><strong>{p.note || (isAr ? 'مساهمة الساكن' : 'Cotisation copropriétaire')}</strong></td>
                <td>{p.profiles?.full_name ? `${p.profiles.full_name} (${p.profiles.apartment_number || ''})` : (isAr ? 'ساكن' : 'Résident')}</td>
                <td style={{ color: '#15803d', fontWeight: 800 }}>+{p.amount} {isAr ? 'درهم' : 'DH'}</td>
                <td>—</td>
                <td><span style={{ color: '#15803d', fontWeight: 700 }}>{isAr ? '✅ محصل' : '✅ Encaissé'}</span></td>
              </tr>
            ))}

            {/* 2. Dépenses prestataires */}
            {virements.filter(v => v.doc_status === 'paye').map(v => (
              <tr key={v.id}>
                <td>{new Date(v.created_at || Date.now()).toLocaleDateString('fr-FR')}</td>
                <td>
                  <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.8rem' }}>
                    {isAr ? '📉 مصروف' : '📉 Sortie'}
                  </span>
                </td>
                <td><strong>{v.note || v.reference || (isAr ? 'فاتورة شركة' : 'Facture prestataire')}</strong></td>
                <td>{isAr ? 'شركة خارجية' : 'Prestataire externe'}</td>
                <td>—</td>
                <td style={{ color: '#b91c1c', fontWeight: 800 }}>-{v.amount} {isAr ? 'درهم' : 'DH'}</td>
                <td><span style={{ color: '#15803d', fontWeight: 700 }}>{isAr ? '✅ مؤدى' : '✅ Réglé'}</span></td>
              </tr>
            ))}

            {/* 3. Dépenses directes */}
            {extraExpenses.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>
                  <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.8rem' }}>
                    {isAr ? '📉 مصروف' : '📉 Sortie'}
                  </span>
                </td>
                <td><strong>{e.motif}</strong></td>
                <td>{e.beneficiaire}</td>
                <td>—</td>
                <td style={{ color: '#b91c1c', fontWeight: 800 }}>-{e.amount} {isAr ? 'درهم' : 'DH'}</td>
                <td><span style={{ color: '#15803d', fontWeight: 700 }}>{isAr ? '✅ مؤدى' : '✅ Réglé'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
