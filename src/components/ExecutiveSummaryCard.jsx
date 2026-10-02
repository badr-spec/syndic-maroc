import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ExecutiveSummaryCard() {
  const { profile } = useAuth()
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [stats, setStats] = useState({
    totalResidents: 24,
    paidResidents: 19,
    unpaidResidents: 5,
    recoveryRate: 79,
    cashBalance: 42350,
    monthlyIncome: 9500,
    monthlyExpenses: 4200,
    openReclamations: 1,
    urgentReclamations: 1
  })
  const [showBilanModal, setShowBilanModal] = useState(false)

  useEffect(() => {
    async function loadStats() {
      if (!profile?.residence_id) return
      try {
        const { data: payments } = await supabase
          .from('payments')
          .select('status, amount')
          .eq('residence_id', profile.residence_id)

        if (payments && payments.length > 0) {
          const paid = payments.filter(p => p.status === 'paid').length
          const total = payments.length
          const rate = total > 0 ? Math.round((paid / total) * 100) : 0
          setStats(prev => ({
            ...prev,
            totalResidents: total,
            paidResidents: paid,
            unpaidResidents: total - paid,
            recoveryRate: rate
          }))
        }
      } catch (e) {}
    }
    loadStats()
  }, [profile])

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      marginBottom: '18px'
    }}>
      {/* Top row: Title + Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '14px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '12px'
      }}>
        <div>
          <span style={{
            fontSize: '0.72rem',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#64748b'
          }}>
            {isAr ? 'لوحة القيادة التنفيذية — ' : 'TABLEAU DE BORD EXÉCUTIF — '}
            {new Date().toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
          </span>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', color: '#0f172a' }}>
            {isAr ? 'مؤشرات الأداء والوضعية المالية' : 'Indicateurs Clés & Santé de la Copropriété'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowBilanModal(true)}
          style={{
            background: '#ffffff',
            color: '#047857',
            border: '1.5px solid #047857',
            padding: '7px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isAr ? '🖨️ طباعة تقرير الشهر (A4)' : '🖨️ Affichage Hall (Bilan Mensuel)'}
        </button>
      </div>

      {/* KPI Grid - Sober, Functional, Colors ONLY for Paid / Unpaid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Recovery Rate (Paid / Unpaid) */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              {isAr ? 'نسبة الاستخلاص' : 'Taux de Recouvrement'}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: stats.recoveryRate >= 75 ? '#dcfce7' : '#fee2e2',
              color: stats.recoveryRate >= 75 ? '#16a34a' : '#dc2626'
            }}>
              {stats.recoveryRate}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
              ● {stats.paidResidents} {isAr ? 'مؤدى' : 'Payés'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>
              ● {stats.unpaidResidents} {isAr ? 'غير مؤدى' : 'Non payés'}
            </span>
          </div>

          {/* Minimalist 2-color Progress bar */}
          <div style={{ height: '6px', background: '#fee2e2', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
            <div style={{ width: `${stats.recoveryRate}%`, height: '100%', background: '#16a34a' }} />
          </div>
        </div>

        {/* Trésorerie Solde */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            {isAr ? 'رصيد الصندوق' : 'Solde Caisse & Banque'}
          </span>
          <strong style={{ fontSize: '1.4rem', color: '#0f172a', display: 'block' }}>
            {stats.cashBalance.toLocaleString()} {isAr ? 'درهم' : 'DH'}
          </strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {isAr ? 'الرصيد الصافي المتاح' : 'Disponible net'}
          </span>
        </div>

        {/* Recettes vs Dépenses */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            {isAr ? 'حركة الشهر' : 'Flux Mensuel'}
          </span>
          <div style={{ fontSize: '0.8rem', marginBottom: '3px' }}>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>
              + {stats.monthlyIncome.toLocaleString()} DH
            </span>
            <span style={{ color: '#64748b', fontSize: '0.72rem', marginInlineStart: '4px' }}>
              ({isAr ? 'مداخيل' : 'Reçus'})
            </span>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ color: '#dc2626', fontWeight: 700 }}>
              - {stats.monthlyExpenses.toLocaleString()} DH
            </span>
            <span style={{ color: '#64748b', fontSize: '0.72rem', marginInlineStart: '4px' }}>
              ({isAr ? 'مصاريف' : 'Dépenses'})
            </span>
          </div>
        </div>

        {/* Pannes & Réclamations */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px 14px'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            {isAr ? 'الأعطال والصيانة' : 'Pannes & Incidents'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {stats.urgentReclamations > 0 ? (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#dc2626',
                background: '#fee2e2',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                🚨 {stats.urgentReclamations} {isAr ? 'عطل قيد الإصلاح' : 'panne urgente'}
              </span>
            ) : (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#16a34a',
                background: '#dcfce7',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                ✓ {isAr ? 'كل المرافق تعمل' : 'Aucune panne'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
