import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function GenerateMonthlyChargesModal({ residenceId, residents, onGenerated, onClose }) {
  const today = new Date()
  const nextMonthIndex = (today.getMonth() + 1) % 12
  const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear()

  const [month, setMonth] = useState(MONTHS_FR[nextMonthIndex])
  const [year, setYear] = useState(nextYear.toString())
  const [calculationMode, setCalculationMode] = useState('fixe') // 'fixe', 'surface', 'tantieme'
  const [amount, setAmount] = useState('500') // Fixed amount
  const [ratePerSqm, setRatePerSqm] = useState('5') // DH / m²
  const [totalBudget, setTotalBudget] = useState('12000') // Total budget for tantièmes
  const [description, setDescription] = useState(
    'Entretien ascenseur, nettoyage des parties communes, éclairage et gardiennage.'
  )
  const [generating, setGenerating] = useState(false)

  // Compute default due date
  const selectedMonthIndex = MONTHS_FR.indexOf(month)
  const lastDay = new Date(parseInt(year), selectedMonthIndex + 1, 0).getDate()
  const defaultDueDate = `${year}-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const [dueDate, setDueDate] = useState(defaultDueDate)

  const activeResidents = residents.filter(r => r.role === 'resident')

  // Calculate individual amount for a resident
  function getResidentAmount(r) {
    if (calculationMode === 'fixe') {
      return parseFloat(amount) || 500
    }
    if (calculationMode === 'surface') {
      // If surface is recorded, use it, else default to 90m²
      const surface = parseFloat(r.surface_m2) || 90
      return Math.round(surface * (parseFloat(ratePerSqm) || 5))
    }
    if (calculationMode === 'tantieme') {
      // Tantième / 1000 or equal share
      const tantieme = parseFloat(r.tantiemes) || (1000 / (activeResidents.length || 1))
      const budget = parseFloat(totalBudget) || 12000
      return Math.round((tantieme / 1000) * budget)
    }
    return 500
  }

  const totalCalculated = activeResidents.reduce((sum, r) => sum + getResidentAmount(r), 0)
  const avgAmount = activeResidents.length > 0 ? Math.round(totalCalculated / activeResidents.length) : 0

  async function handleGenerate(e) {
    e.preventDefault()
    setGenerating(true)
    try {
      const title = `Cotisation mensuelle — ${month} ${year}`

      // 1. Create the charge record
      const { data: charge, error: chargeErr } = await supabase
        .from('charges')
        .insert({
          residence_id: residenceId,
          title: title,
          description: `${description} [Mode: ${calculationMode.toUpperCase()}]`,
          amount: avgAmount,
          due_date: dueDate
        })
        .select()
        .single()

      if (chargeErr) throw chargeErr

      // 2. Assign pending payment with personalized calculated amount to each resident
      if (activeResidents.length > 0) {
        const paymentRows = activeResidents.map(r => ({
          charge_id: charge.id,
          paid_by: r.id,
          resident_id: r.id,
          residence_id: residenceId,
          amount: getResidentAmount(r),
          status: 'pending',
          paid_at: null,
          note: calculationMode === 'surface'
            ? `Calculé selon la superficie (${r.surface_m2 || 90} m² × ${ratePerSqm} DH)`
            : calculationMode === 'tantieme'
            ? `Calculé au tantième (${r.tantiemes || Math.round(1000/activeResidents.length)}/1000)`
            : 'Montant forfaitaire identique'
        }))
        const { error: payErr } = await supabase.from('payments').insert(paymentRows)
        if (payErr) throw payErr
      }

      if (onGenerated) onGenerated()
      onClose()
    } catch (err) {
      alert(err.message || 'Erreur lors de la génération des cotisations')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="card" style={{
        background: '#ffffff',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '14px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
              📅 Générateur Automatique de Cotisations
            </h3>
            <p className="muted small" style={{ margin: '2px 0 0 0' }}>
              Calcul forfaitaire ou selon la superficie & tantièmes (Loi 18-00)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Month & Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label className="small" style={{ fontWeight: 700 }}>Mois de la cotisation</label>
              <select
                value={month}
                onChange={e => {
                  setMonth(e.target.value)
                  const mIdx = MONTHS_FR.indexOf(e.target.value)
                  const lDay = new Date(parseInt(year), mIdx + 1, 0).getDate()
                  setDueDate(`${year}-${String(mIdx + 1).padStart(2, '0')}-${String(lDay).padStart(2, '0')}`)
                }}
                style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              >
                {MONTHS_FR.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="small" style={{ fontWeight: 700 }}>Année</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              />
            </div>
          </div>

          {/* Mode Selector (Feature 4: Calcul au tantième / surface) */}
          <div>
            <label className="small" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Mode de calcul des charges (Loi 18-00) :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setCalculationMode('fixe')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: calculationMode === 'fixe' ? 800 : 500,
                  border: calculationMode === 'fixe' ? '2px solid #047857' : '1px solid #cbd5e1',
                  background: calculationMode === 'fixe' ? '#ecfdf5' : '#ffffff',
                  color: calculationMode === 'fixe' ? '#065f46' : '#334155',
                  cursor: 'pointer'
                }}
              >
                ⚪ Montant fixe
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('surface')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: calculationMode === 'surface' ? 800 : 500,
                  border: calculationMode === 'surface' ? '2px solid #047857' : '1px solid #cbd5e1',
                  background: calculationMode === 'surface' ? '#ecfdf5' : '#ffffff',
                  color: calculationMode === 'surface' ? '#065f46' : '#334155',
                  cursor: 'pointer'
                }}
              >
                📐 Surface (DH/m²)
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('tantieme')}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: calculationMode === 'tantieme' ? 800 : 500,
                  border: calculationMode === 'tantieme' ? '2px solid #047857' : '1px solid #cbd5e1',
                  background: calculationMode === 'tantieme' ? '#ecfdf5' : '#ffffff',
                  color: calculationMode === 'tantieme' ? '#065f46' : '#334155',
                  cursor: 'pointer'
                }}
              >
                ⚖️ Tantièmes / Millièmes
              </button>
            </div>
          </div>

          {/* Mode inputs */}
          {calculationMode === 'fixe' && (
            <div>
              <label className="small" style={{ fontWeight: 700 }}>Montant forfaitaire par appartement (DH) *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              />
            </div>
          )}

          {calculationMode === 'surface' && (
            <div>
              <label className="small" style={{ fontWeight: 700 }}>Tarif de charge au m² habitable (DH/m²) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={ratePerSqm}
                onChange={e => setRatePerSqm(e.target.value)}
                placeholder="Ex: 5 DH / m²"
                style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              />
              <span className="small muted" style={{ display: 'block', marginTop: '4px' }}>
                Exemple : Appartement 90m² = 450 DH · Appartement 120m² = 600 DH.
              </span>
            </div>
          )}

          {calculationMode === 'tantieme' && (
            <div>
              <label className="small" style={{ fontWeight: 700 }}>Budget mensuel global à répartir (DH) *</label>
              <input
                type="number"
                required
                value={totalBudget}
                onChange={e => setTotalBudget(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px' }}
              />
              <span className="small muted" style={{ display: 'block', marginTop: '4px' }}>
                Répartition légale selon les parts de chaque copropriétaire sur 1 000 millièmes.
              </span>
            </div>
          )}

          <div>
            <label className="small" style={{ fontWeight: 700 }}>Date d'échéance *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
            />
          </div>

          <div>
            <label className="small" style={{ fontWeight: 700 }}>Description des charges</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '8px' }}
            />
          </div>

          {/* Recap Box */}
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '10px',
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.86rem' }}>
              <span>🏢 Résidents ciblés :</span>
              <strong>{activeResidents.length} appartements</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.86rem' }}>
              <span>⚙️ Règle appliquée :</span>
              <strong>
                {calculationMode === 'fixe'
                  ? `${amount} DH fixe / apt`
                  : calculationMode === 'surface'
                  ? `${ratePerSqm} DH/m² selon superficie`
                  : `Budget ${totalBudget} DH au tantième`}
              </strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px dashed #86efac',
              fontSize: '0.92rem',
              color: '#15803d'
            }}>
              <strong>💰 Total attendu pour la résidence :</strong>
              <strong style={{ fontSize: '1.1rem' }}>{totalCalculated.toLocaleString()} DH</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={generating}
              style={{ background: '#047857', borderColor: '#047857', fontWeight: 700 }}
            >
              {generating ? 'Génération en cours...' : `🚀 Générer pour les ${activeResidents.length} résidents`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
